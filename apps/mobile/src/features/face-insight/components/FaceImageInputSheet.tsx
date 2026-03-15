import { Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { CameraIcon, GalleryIcon } from '../../../components/icons';

interface FaceImageInputSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string, source: 'camera' | 'library') => void;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function resizeImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch (e) {
    console.warn('expo-image-manipulator unavailable, using original image', e);
    return uri;
  }
}

function showSettingsAlert(title: string) {
  Alert.alert(title, 'Please allow access in Settings to use this feature.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

export function FaceImageInputSheet({ visible, onClose, onImageSelected }: FaceImageInputSheetProps) {
  const { t } = useTranslation('common');

  async function handleCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showSettingsAlert('Camera Access Required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      Alert.alert('Image Too Large', 'Please choose an image under 5 MB.');
      return;
    }

    const uri = await resizeImage(asset.uri);
    onImageSelected(uri, 'camera');
    onClose();
  }

  async function handleLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showSettingsAlert('Photo Library Access Required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      selectionLimit: 1,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      Alert.alert('Image Too Large', 'Please choose an image under 5 MB.');
      return;
    }

    const uri = await resizeImage(asset.uri);
    onImageSelected(uri, 'library');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t('face.input.title')}</Text>
          <Text style={styles.subtitle}>{t('face.input.subtitle')}</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={handleCamera}>
            <CameraIcon color="#C9A84C" size={22} />
            <Text style={styles.actionLabel}>{t('face.input.camera')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleLibrary}>
            <GalleryIcon color="#C9A84C" size={22} />
            <Text style={styles.actionLabel}>{t('face.input.library')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#3d2471',
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9d8fbe',
    fontSize: 14,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    backgroundColor: '#2d1854',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  actionLabel: {
    color: '#e9d5ff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3d2471',
  },
  cancelText: {
    color: '#9d8fbe',
    fontWeight: '600',
    fontSize: 15,
  },
});
