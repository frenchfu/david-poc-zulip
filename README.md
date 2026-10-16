# 關貿通訊 (Tradevan Chat Mobile)

本專案為 **關貿網路股份有限公司 (Trade-Van Information Services Co., Ltd.)** 企業行動通訊 PoC 之專屬行動端 App。  
基於開源專案 [Zulip Mobile](https://github.com/zulip/zulip-mobile) 進行深度客製化與功能擴充。

---

## 📜 開源授權與修改聲明 (Apache License 2.0 Compliance)

* 本專案依循 **Apache License, Version 2.0** 規範發布，完整授權條款請參閱本目錄下之 [LICENSE](LICENSE) 文件。
* **依據 Apache 2.0 第 4(b) 條之顯著修改聲明 (Prominent Modification Notice)**：
  1. **品牌視覺與識別替換**：導入 Trade-van 專屬企業視覺識別、應用程式名稱（關貿通訊）與專屬桌布 Launcher 圖標。
  2. **套件識別碼客製**：設定 Android 專屬 Application ID (`com.example.davidpoczulip`)。
  3. **伺服器連線優化**：預填公司企業伺服器位址，並完整保留多專案/多組織（Multi-Realm）自由切換機制。
  4. **自主推播引擎整合**：整合自主託管之 Firebase Cloud Messaging (FCM) 服務金鑰與推播架構。
* **商標與歸屬免責聲明**：
  * Zulip 為 Kandra Labs, Inc. 之註冊商標。
  * 本專案為關貿網路獨立客製之衍生版本，未受 Kandra Labs, Inc. 贊助或官方背書。
  * 詳細修改與法律聲明請參閱 [NOTICE.txt](NOTICE.txt)。

---

## 原廠專案資訊 (Upstream Project)

Zulip Mobile (legacy codebase built on React Native).



### Discussion

To get involved in Zulip Mobile development, please join us on
[the Zulip community Zulip server][czo-doc], in the
[#mobile-dev-help][czo-mobile-dev-help] channel.  Come say hello, discuss areas to
work on, and ask and answer questions.

Bug reports and feedback from using the app are welcome.
For those, please use the [#mobile][czo-mobile] channel;
that helps a wider set of Zulip contributors see your feedback.

[czo-mobile-dev-help]: https://chat.zulip.org/#narrow/stream/516-mobile-dev-help
[czo-mobile]: https://chat.zulip.org/#narrow/stream/48-mobile
[czo-doc]: https://zulip.readthedocs.io/en/latest/contributing/chat-zulip-org.html


### Using the beta

One important way to contribute is to run beta versions of the app, and report
bugs!  To get the beta:

* Android: install the app, then just
  [join the testing program](https://play.google.com/apps/testing/com.zulipmobile/)
  on Google Play.
  * Or if you don't use Google Play, you can [download an
    APK](https://github.com/zulip/zulip-mobile/releases/); the latest
    release on GitHub (including "pre-releases") is the current beta.
* iOS: install [TestFlight](https://developer.apple.com/testflight/testers/),
  then open [this public invitation link](https://testflight.apple.com/join/ZuzqwXGf)
  on your device.

Bug reports are welcome either in [the #mobile stream](#discussion) or
on this GitHub repo.


### Development

Zulip Mobile is written in JavaScript with React Native.  To get
started with the code, follow this doc:

* [Developer Guide](docs/developer-guide.md)

Then see our [Contribution Guidelines](CONTRIBUTING.md), and come say
hello in [the #mobile-dev-help stream](#discussion).

For more reading, take a look at our [developer docs](docs/).


### History

Zulip Mobile supersedes two legacy Zulip apps,
[zulip-ios](https://github.com/zulip/zulip-ios-legacy) and
[zulip-android](https://github.com/zulip/zulip-android)
([more history](https://github.com/zulip/zulip-android/blob/master/android-strategy.md)).


## License

Copyright (c) 2016-2024 Kandra Labs, Inc., and contributors, and 2016 Dropbox, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

The software includes some works released by third parties under other
free and open source licenses. Those works are redistributed under the
license terms under which the works were received.
