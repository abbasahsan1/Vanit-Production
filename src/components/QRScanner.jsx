import React, { useState, useRef, useEffect } from 'react';
import { FaQrcode, FaCamera, FaCameraRotate } from 'react-icons/fa6';
import { FaCheckCircle, FaExclamationTriangle, FaTimes, FaArrowLeft } from 'react-icons/fa';
import jsQR from 'jsqr';
import axios from 'axios';

const QRScanner = ({ studentId, onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front camera, 'environment' for back
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    console.log('🎥 QR Scanner useEffect triggered, isScanning:', isScanning, 'facingMode:', facingMode);
    
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      console.log('🧹 QR Scanner cleanup');
      stopCamera();
    };
  }, [isScanning, facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      setHasPermission(null);

      console.log('🎥 Starting camera with facingMode:', facingMode);

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded, starting playback');
          videoRef.current.play().then(() => {
            console.log('✅ Video playing, starting QR scan interval');
            // Start scanning for QR codes after video starts
            scanIntervalRef.current = setInterval(scanForQRCode, 500); // Scan every 500ms
          }).catch(err => {
            console.error('❌ Error playing video:', err);
            setError('Failed to start video playback');
          });
        };
      }
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please check your device camera.');
      } else {
        setError('Camera error: ' + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanForQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      return; // Video not ready yet
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (canvas.width === 0 || canvas.height === 0) {
        return; // Video dimensions not ready
      }

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect QR code using jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code && code.data) {
        console.log('🎯 QR Code detected:', code.data.substring(0, 50) + '...');
        setIsScanning(false);
        await processQRCode(code.data);
      }
    } catch (err) {
      console.error('❌ Error scanning QR code:', err);
    }
  };

  // Simulate QR code scanning with proper QR data for demo
  const simulateQRScan = async () => {
    console.log('🧪 Simulating QR scan...');
    setIsScanning(false);
    
    // First generate a real QR code from the server
    try {
      const qrResponse = await axios.post('http://localhost:5000/api/attendance/generate-qr/Cust-Bahria');
      if (qrResponse.data.success) {
        console.log('✅ Generated QR for demo:', qrResponse.data.data.qrData.substring(0, 50) + '...');
        await processQRCode(qrResponse.data.data.qrData);
      } else {
        console.error('❌ Failed to generate demo QR:', qrResponse.data.error);
        // Try generating from admin endpoint instead
        try {
          const adminQrResponse = await axios.post('http://localhost:5000/api/admin/attendance/generate-qr', {
            routeName: 'Cust-Bahria'
          });
          if (adminQrResponse.data.success) {
            console.log('✅ Generated QR from admin endpoint for demo:', adminQrResponse.data.qrCode.substring(0, 50) + '...');
            await processQRCode(adminQrResponse.data.qrCode);
          } else {
            throw new Error('Admin QR generation failed');
          }
        } catch (adminError) {
          console.error('❌ Admin QR generation also failed:', adminError);
          // Last resort - use a properly formatted mock
          const mockPayload = {
            route_name: "Cust-Bahria",
            generated_at: Date.now(),
            expires_at: Date.now() + (24 * 60 * 60 * 1000),
            version: "1.0",
            hash: "demo-hash-not-validated"
          };
          const mockQRData = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
          await processQRCode(mockQRData);
        }
      }
    } catch (error) {
      console.error('❌ Error in demo QR scan:', error);
      // Last resort - use a properly formatted mock
      const mockPayload = {
        route_name: "Cust-Bahria",
        generated_at: Date.now(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        version: "1.0",
        hash: "demo-hash-not-validated"
      };
      const mockQRData = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
      await processQRCode(mockQRData);
    }
  };

  const processQRCode = async (qrData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current location if available
      let latitude = null;
      let longitude = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log('📍 Location obtained for QR scan:', { latitude, longitude });
        } catch (err) {
          console.log('📍 Location not available for QR scan:', err);
        }
      }

      console.log('📱 Sending QR scan request:', {
        studentId,
        qrData: qrData.substring(0, 50) + '...',
        hasLocation: !!(latitude && longitude)
      });

      // Send QR scan to backend
      const response = await axios.post('http://localhost:5000/api/attendance/qr-scan', {
        studentId: studentId,
        qrData: qrData,
        latitude: latitude,
        longitude: longitude
      });

      console.log('📱 QR scan response:', response.data);

      if (response.data.success) {
        setScanResult({
          success: true,
          message: response.data.message || 'Attendance marked successfully!',
          data: response.data.data
        });
        
        if (onScanSuccess) {
          onScanSuccess(response.data);
        }
      } else {
        setScanResult({
          success: false,
          message: response.data.error || 'Failed to mark attendance'
        });
      }
    } catch (err) {
      console.error('❌ QR scan error:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  if (scanResult) {
    return (
      <div className="student-view p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8">
            <div className="text-center">
              {scanResult.success ? (
                <div>
                  <FaCheckCircle className="text-6xl mx-auto mb-6" style={{ color: 'var(--color-success)' }} />
                  <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>Success!</h1>
                  <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>{scanResult.message}</p>
                  {scanResult.data && (
                    <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#D1FAE5' }}>
                      <h3 className="font-semibold mb-2" style={{ color: 'var(--color-success)' }}>Attendance Details</h3>
                      <p style={{ color: 'var(--color-success)' }}>Route: {scanResult.data.route_name}</p>
                      <p style={{ color: 'var(--color-success)' }}>Time: {new Date(scanResult.data.timestamp).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <FaExclamationTriangle className="text-6xl mx-auto mb-6 icon-alert" />
                  <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>Error</h1>
                  <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>{scanResult.message}</p>
                </div>
              )}
              
              <div className="space-x-4">
                <button
                  onClick={resetScanner}
                  className="btn btn-primary font-medium"
                >
                  Scan Again
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-ghost font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-view">
      {/* Header */}
      <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-primary)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid var(--color-border-standard)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-heading)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-heading)' }}>QR Code Scanner</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleCamera}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              title="Switch Camera"
            >
              <FaCameraRotate className="text-lg" />
            </button>
            <button
              onClick={simulateQRScan}
              className="transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-primary-action)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
              title="Demo Scan"
            >
              <FaQrcode className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Instructions */}
          <div className="card p-6 mb-8">
            <div className="text-center mb-6">
              <FaQrcode className="text-4xl mx-auto mb-4" style={{ color: 'var(--color-primary-action)' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Scan QR Code</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Point your camera at the QR code displayed by your captain to mark your attendance.
              </p>
            </div>
            
            {error && (
              <div className="border rounded-lg p-4 mb-6" style={{ backgroundColor: '#FEE2E2', borderColor: 'var(--color-danger)' }}>
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2 icon-alert" />
                  <p style={{ color: 'var(--color-danger)' }}>{error}</p>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="border rounded-lg p-4 mb-6" style={{ backgroundColor: '#FEF3C7', borderColor: 'var(--color-warning)' }}>
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2 icon-emphasis" />
                  <p style={{ color: 'var(--color-warning)' }}>
                    Camera access denied. Please allow camera permissions in your browser settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Camera View */}
          <div className="card p-6">
            <div className="relative">
              {!isScanning ? (
                <div className="text-center py-12">
                  <FaCamera className="text-4xl mx-auto mb-4 icon-ui" />
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>Camera Ready</h3>
                  <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>Click the button below to start scanning</p>
                  <button
                    onClick={() => setIsScanning(true)}
                    className="btn btn-primary font-medium"
                    disabled={hasPermission === false}
                  >
                    Start Scanning
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 rounded-lg p-2" style={{ borderColor: 'var(--color-primary-action)' }}>
                      <div className="w-64 h-64 border-2 rounded-lg relative" style={{ borderColor: 'var(--color-primary-action)' }}>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-overlay-dark)' }}>
                      <div className="card p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary-action)' }}></div>
                        <p style={{ color: 'var(--color-text-body)' }}>Processing QR code...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
