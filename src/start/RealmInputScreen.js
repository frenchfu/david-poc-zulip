/* @flow strict-local */
import React, { useCallback } from 'react';
import type { Node } from 'react';
import { Keyboard, View, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import ZulipTextIntl from '../common/ZulipTextIntl';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import { tryParseUrl } from '../utils/url';
import { fetchServerSettings } from '../message/fetchActions';
import { ThemeContext } from '../styles/theme';
import { createStyleSheet, HALF_COLOR } from '../styles';
import { showErrorAlert } from '../utils/info';
import { TranslationContext } from '../boot/TranslationProvider';
import type { LocalizableText } from '../types';
import { getGlobalSettings } from '../directSelectors';
import { useGlobalSelector } from '../react-redux';
import { BRAND_COLOR } from '../styles/constants';
import ZulipText from '../common/ZulipText';
import WebLink from '../common/WebLink';
import { ENTERPRISE_CONFIG } from '../config/enterprise';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'realm-input'>,
  route: RouteProp<'realm-input', {| initial: boolean | void |}>,
|}>;

enum ValidationError {
  Empty = 0,
  InvalidUrl = 1,
  NoUseEmail = 2,
  UnsupportedSchemeZulip = 3,
  UnsupportedSchemeOther = 4,
}

function validationErrorMsg(validationError: ValidationError): LocalizableText {
  switch (validationError) {
    case ValidationError.Empty:
      return 'Please enter a URL.';
    case ValidationError.InvalidUrl:
      return 'Please enter a valid URL.';
    case ValidationError.NoUseEmail:
      return 'Please enter the server URL, not your email.';
    case ValidationError.UnsupportedSchemeZulip:
    // TODO: What would be more helpful here? (First, maybe find out what
    //   leads people to try a "zulip://" URL, if anyone actually does that)
    case ValidationError.UnsupportedSchemeOther: // eslint-disable-line no-fallthrough
      return 'The server URL must start with http:// or https://.';
  }
}

type MaybeParsedInput =
  | {| +valid: true, value: URL |}
  | {| +valid: false, error: ValidationError |};

const tryParseInput = (realmInputValue: string): MaybeParsedInput => {
  const trimmedInputValue = realmInputValue.trim();

  // 留空即代表登入關貿企業總部
  if (trimmedInputValue.length === 0) {
    const defaultUrl = tryParseUrl(ENTERPRISE_CONFIG.hqServerUrl);
    if (!defaultUrl) {
      return { valid: false, error: ValidationError.InvalidUrl };
    }
    return { valid: true, value: defaultUrl };
  }

  // 智慧識別：若輸入簡短代碼（不含點與斜線，如 t-ex-core），自動拼裝成專案子網域
  if (!trimmedInputValue.includes('.') && !trimmedInputValue.includes('/')) {
    const projectUrl = tryParseUrl(`https://${trimmedInputValue}.${ENTERPRISE_CONFIG.baseDomain}`);
    if (!projectUrl) {
      return { valid: false, error: ValidationError.InvalidUrl };
    }
    return { valid: true, value: projectUrl };
  }

  let url = tryParseUrl(trimmedInputValue);
  if (!/^https?:\/\//.test(trimmedInputValue)) {
    if (url && url.protocol === 'zulip:') {
      return { valid: false, error: ValidationError.UnsupportedSchemeZulip };
    } else if (url && url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: ValidationError.UnsupportedSchemeOther };
    }
    url = tryParseUrl(`https://${trimmedInputValue}`);
  }

  if (!url) {
    return { valid: false, error: ValidationError.InvalidUrl };
  }
  if (url.username !== '') {
    return { valid: false, error: ValidationError.NoUseEmail };
  }

  return { valid: true, value: url };
};

type Suggestion =
  | ValidationError // Display relevant validation error message
  | string // Suggest this string as the server URL
  | null; // No suggestion

function getSuggestion(realmInputValue: string, maybeParsedInput: MaybeParsedInput): Suggestion {
  const trimmed = realmInputValue.trim();

  if (trimmed.length === 0) {
    return '🏢 目標：關貿網路 企業總部';
  }

  if (!maybeParsedInput.valid) {
    switch (maybeParsedInput.error) {
      case ValidationError.NoUseEmail:
      case ValidationError.UnsupportedSchemeZulip:
      case ValidationError.UnsupportedSchemeOther:
        return maybeParsedInput.error;
      case ValidationError.Empty:
      case ValidationError.InvalidUrl:
        return null;
    }
  }

  if (!trimmed.includes('.') && !trimmed.includes('/')) {
    const knownName = ENTERPRISE_CONFIG.knownProjects[trimmed.toLowerCase()];
    if (knownName) {
      return `🚄 目標：${knownName} (${trimmed})`;
    }
    return `📁 目標專案：${trimmed}.${ENTERPRISE_CONFIG.baseDomain}`;
  }

  return `🌐 目標伺服器：${trimmed}`;
}

export default function RealmInputScreen(props: Props): Node {
  const { navigation, route } = props;

  const globalSettings = useGlobalSelector(getGlobalSettings);

  const _ = React.useContext(TranslationContext);
  const themeContext = React.useContext(ThemeContext);

  const [progress, setProgress] = React.useState(false);
  const [realmInputValue, setRealmInputValue] = React.useState('');
  const maybeParsedInput = tryParseInput(realmInputValue);

  const textInputRef = React.useRef<React$ElementRef<typeof TextInput> | null>(null);

  // When the route is focused in the navigation, focus the input.
  // Otherwise, if you go back to this screen from the auth screen, the
  // input won't be focused.
  useFocusEffect(
    useCallback(() => {
      if (textInputRef.current) {
        // Sometimes the effect of this `.focus()` is immediately undone
        // (the keyboard is closed) by a Keyboard.dismiss() from React
        // Navigation's internals. Seems like a complex bug, but the symptom
        // isn't terrible, it just means that on back-navigating to this
        // screen, sometimes the keyboard flicks open then closed, instead
        // of just opening. Shrug. See
        //   https://chat.zulip.org/#narrow/stream/243-mobile-team/topic/realm-input/near/1346690
        textInputRef.current.focus();
      }
    }, []),
  );

  const tryRealm = React.useCallback(async () => {
    if (!maybeParsedInput.valid) {
      showErrorAlert(_('Invalid input'), _(validationErrorMsg(maybeParsedInput.error)));
      return;
    }

    setProgress(true);
    const result = await fetchServerSettings(maybeParsedInput.value);
    setProgress(false);
    if (result.type === 'error') {
      showErrorAlert(
        _(result.title),
        _(result.message),
        result.learnMoreButton && {
          url: result.learnMoreButton.url,
          text: result.learnMoreButton.text != null ? _(result.learnMoreButton.text) : undefined,
          globalSettings,
        },
      );
      return;
    }
    const serverSettings = result.value;
    navigation.push('auth', { serverSettings });
    Keyboard.dismiss();
  }, [navigation, maybeParsedInput, globalSettings, _]);

  const suggestion = getSuggestion(realmInputValue, maybeParsedInput);

  const handlePressSuggestion = React.useCallback(suggestion_ => {
    setRealmInputValue(suggestion_);
  }, []);

  const styles = React.useMemo(
    () =>
      createStyleSheet({
        inputWrapper: {
          flexDirection: 'row',
          opacity: 0.8,
          marginTop: 16,
          marginBottom: 8,
        },
        input: {
          flex: 1,
          padding: 0,
          fontSize: 20,
          color: themeContext.color,
        },
        suggestionText: { fontSize: 13, marginTop: 4, marginBottom: 8 },
        suggestionTextLink: {
          fontStyle: 'normal',
          color: BRAND_COLOR, // chosen to mimic WebLink
        },
        button: { marginTop: 8 },
      }),
    [themeContext],
  );

  const suggestionContent = React.useMemo(() => {
    if (suggestion === null) {
      return '\u200b'; // U+200B ZERO WIDTH SPACE
    } else if (typeof suggestion === 'string') {
      return (
        <ZulipText inheritFontSize style={{ color: BRAND_COLOR, fontWeight: '500' }}>
          {suggestion}
        </ZulipText>
      );
    } else {
      return <ZulipTextIntl inheritFontSize text={validationErrorMsg(suggestion)} />;
    }
  }, [suggestion]);

  const isHQ = realmInputValue.trim() === '';

  return (
    <Screen
      title={ENTERPRISE_CONFIG.appName}
      canGoBack={!route.params.initial}
      padding
      centerContent
      keyboardShouldPersistTaps="always"
      shouldShowLoadingBanner={false}
    >
      <ZulipTextIntl
        text={{
          text: '請輸入專案空間代碼（留空直接登入關貿總部）：',
        }}
      />
      <View style={styles.inputWrapper}>
        <TextInput
          value={realmInputValue}
          placeholder="例如: t-ex-core（留空進入總部）"
          placeholderTextColor={HALF_COLOR}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="go"
          onChangeText={setRealmInputValue}
          blurOnSubmit={false}
          keyboardType="default"
          underlineColorAndroid="transparent"
          onSubmitEditing={tryRealm}
          enablesReturnKeyAutomatically={false}
          disableFullscreenUI
          ref={textInputRef}
        />
      </View>
      <ZulipText style={styles.suggestionText}>{suggestionContent}</ZulipText>
      <ZulipButton
        style={styles.button}
        text={isHQ ? '進入關貿總部' : '進入專案空間'}
        progress={progress}
        onPress={tryRealm}
        isPressHandledWhenDisabled
        disabled={!maybeParsedInput.valid}
      />
    </Screen>
  );
}
