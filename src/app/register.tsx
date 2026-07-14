import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FormInputProps = {
  icon: ImageSourcePropType;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
};

function FormInput({
  icon,
  value,
  placeholder,
  onChangeText,
  secureTextEntry = false,
  rightElement,
}: FormInputProps) {
  return (
    <View style={styles.inputShell}>
      <Image source={icon} style={styles.inputIcon} resizeMode="contain" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BBB7B5"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {rightElement}
    </View>
  );
}

type PasswordEyeProps = {
  visible: boolean;
  onPress: () => void;
  label: string;
};

function PasswordEye({ visible, onPress, label }: PasswordEyeProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}>
      <Image
        source={
          visible
            ? require('@/assets/images/InGatePng/OpenEyeIcon.png')
            : require('@/assets/images/InGatePng/Frame.png')
        }
        style={[styles.eyeIcon, visible && styles.openEyeIcon]}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function RegisterScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const hasRequiredValues =
    account.trim().length > 0 && password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const canRegister = hasRequiredValues && passwordsMatch && agreed;

  function handleRegister() {
    if (!hasRequiredValues) {
      Alert.alert('信息未填写完整', '请填写账号、密码并再次确认密码。');
      return;
    }

    if (!passwordsMatch) {
      Alert.alert('两次密码不一致', '请重新确认输入的密码。');
      return;
    }

    if (!agreed) {
      Alert.alert('请勾选协议', '注册前需要阅读并同意用户协议与隐私授权。');
      return;
    }

    Alert.alert('注册成功', '当前为前端演示，账号还没有提交到后端。', [
      {
        text: '去登录',
        onPress: () => router.replace('/login'),
      },
    ]);
  }

  function showPendingFeature(title: string) {
    Alert.alert(title, '这个入口会在后续页面中继续完成。');
  }

  return (
    <ImageBackground
      source={require('@/assets/images/welcome_facing/bgc.png')}
      resizeMode="cover"
      style={styles.background}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.page}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.hero}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="返回"
                hitSlop={12}
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Image
                  source={require('@/assets/images/welcome_facing/back.png')}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </Pressable>

              <View style={styles.welcomeCopy}>
                <Text style={styles.title}>注册</Text>
                <Text style={styles.subtitle}>我们等你好久了！</Text>
              </View>

              <Image
                source={require('@/assets/images/welcome_facing/icon6.png')}
                style={styles.heroMascot}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formScrollContent}>
                <View style={styles.formFields}>
                  <Text style={styles.label}>账号</Text>
                  <FormInput
                    icon={require('@/assets/images/welcome_facing/profile.png')}
                    value={account}
                    onChangeText={setAccount}
                    placeholder="请输入账号"
                  />

                  <Text style={styles.label}>密码</Text>
                  <FormInput
                    icon={require('@/assets/images/welcome_facing/lock.png')}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="请输入密码"
                    secureTextEntry={!passwordVisible}
                    rightElement={
                      <PasswordEye
                        visible={passwordVisible}
                        onPress={() => setPasswordVisible((current) => !current)}
                        label={passwordVisible ? '隐藏密码' : '显示密码'}
                      />
                    }
                  />

                  <FormInput
                    icon={require('@/assets/images/welcome_facing/lock.png')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="重新确认密码"
                    secureTextEntry={!confirmPasswordVisible}
                    rightElement={
                      <PasswordEye
                        visible={confirmPasswordVisible}
                        onPress={() => setConfirmPasswordVisible((current) => !current)}
                        label={confirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
                      />
                    }
                  />

                  <Pressable
                    onPress={handleRegister}
                    style={({ pressed }) => [
                      styles.registerButton,
                      canRegister && styles.registerButtonEnabled,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.registerButtonText,
                        canRegister && styles.registerButtonTextEnabled,
                      ]}>
                      注册
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setAgreed((current) => !current)}
                    style={({ pressed }) => [styles.agreementRow, pressed && styles.pressed]}>
                    <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                      {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                    <Text style={styles.agreementText}>
                      我已阅读并同意
                      <Text style={styles.agreementLink}>《用户协议》</Text>
                      和
                      <Text style={styles.agreementLink}>《隐私授权》</Text>
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.thirdPartySection}>
                  <Text style={styles.helperText}>
                    已有账号？
                    <Text onPress={() => router.replace('/login')} style={styles.helperLink}>
                      立即登录
                    </Text>
                  </Text>

                  <View style={styles.thirdPartyTitleRow}>
                    <View style={styles.divider} />
                    <Text style={styles.thirdPartyTitle}>第三方账号登录</Text>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.socialRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="QQ 登录"
                      onPress={() => showPendingFeature('QQ 登录')}
                      style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
                      <Image
                        source={require('@/assets/images/welcome_facing/QQ.png')}
                        style={styles.qqIcon}
                        resizeMode="contain"
                      />
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="微信登录"
                      onPress={() => showPendingFeature('微信登录')}
                      style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
                      <Image
                        source={require('@/assets/images/welcome_facing/wechat.png')}
                        style={styles.wechatIcon}
                        resizeMode="contain"
                      />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#FFF5EB',
  },
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  hero: {
    height: 218,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  welcomeCopy: {
    position: 'absolute',
    left: 24,
    top: 86,
    zIndex: 2,
  },
  title: {
    color: '#201B18',
    fontSize: 31,
    lineHeight: 41,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 3,
    color: '#8F8782',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  heroMascot: {
    position: 'absolute',
    right: 14,
    bottom: -6,
    width: 140,
    height: 141,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 -2px 10px rgba(206, 153, 108, 0.08)',
  },
  formScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
  },
  formFields: {
    width: '100%',
  },
  label: {
    marginBottom: 10,
    color: '#5F5956',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  inputShell: {
    width: '100%',
    height: 52,
    marginBottom: 18,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#F1F2F3',
  },
  inputIcon: {
    width: 18,
    height: 21,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: '#3A3532',
    fontSize: 14,
  },
  eyeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 18,
    height: 18,
  },
  openEyeIcon: {
    width: 22,
    height: 22,
  },
  helperText: {
    marginBottom: 18,
    color: '#AAA4A0',
    fontSize: 13,
    textAlign: 'center',
  },
  helperLink: {
    color: '#72442F',
    fontSize: 13,
    fontWeight: '700',
  },
  registerButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#FFD29B',
  },
  registerButtonEnabled: {
    backgroundColor: '#FFB66F',
  },
  registerButtonText: {
    color: '#7A3C10',
    fontSize: 16,
    fontWeight: '500',
  },
  registerButtonTextEnabled: {
    color: '#76401E',
  },
  agreementRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    marginTop: 1,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#E8E7E7',
  },
  checkboxChecked: {
    backgroundColor: '#FFAC61',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  agreementText: {
    flexShrink: 1,
    color: '#AAA4A0',
    fontSize: 11,
    lineHeight: 18,
  },
  agreementLink: {
    color: '#76513F',
    fontWeight: '700',
  },
  thirdPartySection: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  thirdPartyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DFDFDF',
  },
  thirdPartyTitle: {
    marginHorizontal: 18,
    color: '#A1A1A1',
    fontSize: 12,
  },
  socialRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 34,
  },
  socialButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#FFB87E',
  },
  wechatIcon: {
    width: 28,
    height: 28,
  },
  qqIcon: {
    width: 22,
    height: 25,
  },
  pressed: {
    opacity: 0.68,
  },
});
