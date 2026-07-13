import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

type LoginMode = 'code' | 'account';

type FormInputProps = {
  icon: ImageSourcePropType;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
};

function FormInput({
  icon,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
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
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      {rightElement}
    </View>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('code');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const hasRequiredValues =
    mode === 'code'
      ? phone.trim().length > 0 && verificationCode.trim().length > 0
      : account.trim().length > 0 && password.length > 0;

  const canLogin = hasRequiredValues && agreed;

  function requestVerificationCode() {
    if (!/^1\d{10}$/.test(phone.trim())) {
      Alert.alert('手机号格式不正确', '请输入 11 位中国大陆手机号。');
      return;
    }

    setCountdown(60);
    Alert.alert('验证码已发送', '当前为前端演示，验证码可以任意填写。');
  }

  function handleLogin() {
    if (!hasRequiredValues) {
      Alert.alert('信息未填写完整', '请先填写登录信息。');
      return;
    }

    if (!agreed) {
      Alert.alert('请勾选协议', '登录前需要阅读并同意用户协议与隐私授权。');
      return;
    }

    router.replace('/(tabs)/study');
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
                <Text style={styles.title}>欢迎登录</Text>
                <Text style={styles.subtitle}>我们等你好久了！</Text>
              </View>

              <Image
                source={require('@/assets/images/welcome_facing/icon6.png')}
                style={styles.heroMascot}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.tabs}>
                <Pressable
                  onPress={() => setMode('code')}
                  style={({ pressed }) => [
                    styles.tab,
                    mode === 'code' ? styles.activeTab : styles.inactiveTab,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.tabText, mode !== 'code' && styles.inactiveTabText]}>
                    验证码登录
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMode('account')}
                  style={({ pressed }) => [
                    styles.tab,
                    mode === 'account' ? styles.activeTab : styles.inactiveTab,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.tabText, mode !== 'account' && styles.inactiveTabText]}>
                    账号登录
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formScrollContent}>
                <View style={styles.formFields}>
                  {mode === 'code' ? (
                    <>
                      <Text style={styles.label}>手机号</Text>
                      <FormInput
                        icon={require('@/assets/images/welcome_facing/profile.png')}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="请输入手机号"
                        keyboardType="phone-pad"
                      />

                      <Text style={styles.label}>验证码</Text>
                      <FormInput
                        icon={require('@/assets/images/welcome_facing/key.png')}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        placeholder="请输入验证码"
                        keyboardType="phone-pad"
                        rightElement={
                          <Pressable
                            disabled={countdown > 0}
                            hitSlop={8}
                            onPress={requestVerificationCode}
                            style={({ pressed }) => pressed && styles.pressed}>
                            <Text
                              style={[
                                styles.inputAction,
                                countdown > 0 && styles.disabledInputAction,
                              ]}>
                              {countdown > 0 ? `${countdown}s` : '获取验证码'}
                            </Text>
                          </Pressable>
                        }
                      />
                    </>
                  ) : (
                    <>
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
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={passwordVisible ? '隐藏密码' : '显示密码'}
                            hitSlop={8}
                            onPress={() => setPasswordVisible((current) => !current)}
                            style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}>
                            <View style={[styles.eye, !passwordVisible && styles.closedEye]}>
                              {passwordVisible ? <View style={styles.pupil} /> : null}
                            </View>
                          </Pressable>
                        }
                      />
                    </>
                  )}

                  <View style={styles.helperRow}>
                    <Text style={styles.helperText}>
                      还没账户？
                      <Text
                        onPress={() => showPendingFeature('注册')}
                        style={styles.helperLink}>
                        去注册
                      </Text>
                    </Text>

                    {mode === 'account' ? (
                      <Text
                        onPress={() => showPendingFeature('忘记密码')}
                        style={styles.helperLink}>
                        忘记密码？
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={handleLogin}
                    style={({ pressed }) => [
                      styles.loginButton,
                      canLogin && styles.loginButtonEnabled,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.loginButtonText,
                        canLogin && styles.loginButtonTextEnabled,
                      ]}>
                      登录
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
                  <View style={styles.thirdPartyTitleRow}>
                    <View style={styles.divider} />
                    <Text style={styles.thirdPartyTitle}>第三方账号登录</Text>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.socialRow}>
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
  tabs: {
    height: 62,
    flexDirection: 'row',
    backgroundColor: '#FFD1AE',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  inactiveTab: {
    backgroundColor: '#FFD1AE',
  },
  tabText: {
    color: '#5D3928',
    fontSize: 16,
    fontWeight: '700',
  },
  inactiveTabText: {
    color: '#96664B',
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
    marginBottom: 22,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#F7F6F8',
  },
  inputIcon: {
    width: 18,
    height: 21,
    marginRight: 10,
    opacity: 0.62,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    color: '#3A3532',
    fontSize: 14,
  },
  inputAction: {
    paddingLeft: 12,
    color: '#825036',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledInputAction: {
    color: '#AAA4A0',
  },
  eyeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: 18,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.6,
    borderColor: '#AAA5A2',
    borderRadius: 12,
  },
  closedEye: {
    height: 8,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 9,
    transform: [{ translateY: -2 }],
  },
  pupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#AAA5A2',
  },
  helperRow: {
    marginTop: -6,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    color: '#AAA4A0',
    fontSize: 13,
  },
  helperLink: {
    color: '#72442F',
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#FFE8CB',
  },
  loginButtonEnabled: {
    backgroundColor: '#FFB66F',
  },
  loginButtonText: {
    color: '#CBB29B',
    fontSize: 17,
    fontWeight: '700',
  },
  loginButtonTextEnabled: {
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
    paddingTop: 34,
  },
  thirdPartyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E7E2DF',
  },
  thirdPartyTitle: {
    marginHorizontal: 18,
    color: '#AAA4A0',
    fontSize: 13,
  },
  socialRow: {
    marginTop: 20,
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
    backgroundColor: '#FFF4E7',
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
