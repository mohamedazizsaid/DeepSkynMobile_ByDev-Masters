import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../theme';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.75;
const SCAN_TOP = (height - SCAN_SIZE) / 2;
const SCAN_LEFT = (width - SCAN_SIZE) / 2;
const SCAN_CENTER_X = SCAN_LEFT + SCAN_SIZE / 2;
const SCAN_CENTER_Y = SCAN_TOP + SCAN_SIZE / 2;

interface FaceIDScannerProps {
    onSuccess: (imageBase64: string) => void;
    onCancel: () => void;
    email: string;
}

export function FaceIDScanner({ onSuccess, onCancel, email }: FaceIDScannerProps) {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [faceDetected, setFaceDetected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Position your face in the circle');
    const scanCompleted = useRef(false);
    const cameraRef = useRef<any>(null);
    const attemptsRef = useRef(0);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const MAX_ATTEMPTS = 12;

    // Animations
    const scanLineY = useSharedValue(0);
    const orbitRotation = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    const scheduleNextCapture = (delay = 700) => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
            captureFaceImage();
        }, delay);
    };

    const captureFaceImage = async () => {
        if (!cameraRef.current || scanCompleted.current) return;

        setStatusMessage('Capturing face...');
        setProgress(40);

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,
                base64: true,
                skipProcessing: false,
                shutterSound: false,
            });

            if (!photo?.base64) {
                attemptsRef.current += 1;
                setProgress(Math.min(90, 10 + attemptsRef.current * 6));
                if (attemptsRef.current >= MAX_ATTEMPTS) {
                    setFaceDetected(false);
                    setScanning(false);
                    setStatusMessage('Face capture failed. Please retry.');
                    return;
                }
                setStatusMessage('Capture missed. Hold still and keep face centered...');
                scheduleNextCapture();
                return;
            }

            scanCompleted.current = true;
            setFaceDetected(true);
            setProgress(100);
            setStatusMessage('Face captured. Verifying...');
            onSuccess(photo.base64);
        } catch (_err) {
            attemptsRef.current += 1;
            if (attemptsRef.current >= MAX_ATTEMPTS) {
                setFaceDetected(false);
                setScanning(false);
                setStatusMessage('Face capture failed. Please retry.');
                return;
            }
            setStatusMessage('Retrying capture... Keep steady.');
            scheduleNextCapture();
        }
    };

    useEffect(() => {
        if (!scanning || scanCompleted.current) return;

        setStatusMessage('Align your face and hold still...');
        setProgress(10);
        scheduleNextCapture(900);

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [scanning]);

    // Start scan animations
    useEffect(() => {
        if (scanning) {
            scanLineY.value = withRepeat(
                withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
            orbitRotation.value = withRepeat(
                withTiming(360, { duration: 3000, easing: Easing.linear }),
                -1,
                false
            );
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [scanning]);

    const animatedLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: interpolate(scanLineY.value, [0, 1], [0, SCAN_SIZE]) }],
        opacity: interpolate(scanLineY.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    }));

    const animatedOrbitStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${orbitRotation.value}deg` }],
    }));

    const animatedCoreStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: interpolate(pulseScale.value, [1, 1.05], [0.1, 0.2]),
    }));

    const handleStartScan = () => {
        scanCompleted.current = false;
        attemptsRef.current = 0;
        setProgress(0);
        setFaceDetected(false);
        setScanning(true);
    };

    if (hasPermission === null) return <View style={styles.container} />;
    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No access to camera</Text>
                <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
            />

            <MaskedView
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                maskElement={
                    <View style={styles.maskContainer}>
                        <Svg width={width} height={height}>
                            <Path
                                d={`M0 0 H${width} V${height} H0 Z M${SCAN_CENTER_X},${SCAN_CENTER_Y} m -${SCAN_SIZE / 2},0 a ${SCAN_SIZE / 2},${SCAN_SIZE / 2} 0 1,0 ${SCAN_SIZE},0 a ${SCAN_SIZE / 2},${SCAN_SIZE / 2} 0 1,0 -${SCAN_SIZE},0`}
                                fill="#fff"
                                fillRule="evenodd"
                            />
                        </Svg>
                    </View>
                }
            >
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            </MaskedView>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>FaceID Scan</Text>
                <Text style={styles.subtitle}>{email}</Text>
            </View>

            {/* Scanner Overlay */}
            <View style={styles.scannerContainer}>
                <View style={[styles.cutoutContainer, faceDetected && scanning ? styles.cutoutActive : null]}>
                    <View style={styles.circleCutout}>
                        {scanning && (
                            <>
                                <Animated.View style={[styles.scanCore, animatedCoreStyle]} />
                                <Animated.View style={[styles.orbitContainer, animatedOrbitStyle]}>
                                    <View style={styles.orbitingBall} />
                                </Animated.View>
                                <Animated.View style={[styles.scanLine, animatedLineStyle]} />
                            </>
                        )}
                    </View>

                    <View style={styles.progressBorder} />
                </View>

                {(scanning || statusMessage !== 'Position your face in the circle') && (
                    <View style={styles.progressLabel}>
                        <Text style={styles.progressText}>
                            {statusMessage}
                        </Text>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                {!scanning ? (
                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={handleStartScan}
                    >
                        <Text style={styles.startButtonText}>Start Face Scan</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.analyzingContainer}>
                        <ActivityIndicator color={Colors.primary} size="small" />
                        <Text style={styles.analyzingText}>
                            {faceDetected ? 'Verifying identity...' : 'Looking for face...'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: 80,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: Colors.white,
        fontSize: FontSizes['2xl'],
        fontWeight: FontWeights.bold,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: FontSizes.base,
        marginTop: 4,
    },
    scannerContainer: {
        width: SCAN_SIZE + 40,
        height: SCAN_SIZE + 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    maskContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    cutoutContainer: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        borderRadius: SCAN_SIZE / 2,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    cutoutActive: {
        borderColor: '#22d3ee',
        borderWidth: 3,
    },
    circleCutout: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: '#22d3ee',
        shadowColor: '#22d3ee',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    orbitContainer: {
        position: 'absolute',
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    orbitingBall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22d3ee',
        borderWidth: 2,
        borderColor: '#fff',
        marginTop: -10,
        shadowColor: '#22d3ee',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
    },
    scanCore: {
        width: SCAN_SIZE * 0.9,
        height: SCAN_SIZE * 0.9,
        borderRadius: (SCAN_SIZE * 0.9) / 2,
        backgroundColor: '#0ea5e9',
        position: 'absolute',
    },
    progressBorder: {
        position: 'absolute',
        width: SCAN_SIZE + 20,
        height: SCAN_SIZE + 20,
        borderRadius: (SCAN_SIZE + 20) / 2,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
        top: -10,
        left: -10,
    },
    footer: {
        position: 'absolute',
        bottom: 100,
        width: '100%',
        paddingHorizontal: 40,
    },
    startButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    startButtonText: {
        color: Colors.white,
        fontSize: FontSizes.lg,
        fontWeight: FontWeights.bold,
    },
    analyzingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    analyzingText: {
        color: '#22d3ee',
        fontSize: FontSizes.base,
        fontWeight: FontWeights.medium,
    },
    progressLabel: {
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    progressText: {
        color: '#fff',
        fontSize: FontSizes.xs,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 30,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: Colors.white,
        marginBottom: 20,
    }
});
