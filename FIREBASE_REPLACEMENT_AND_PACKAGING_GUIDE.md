# 關貿通訊 (Tradevan Chat Mobile) - Firebase 憑證替換與 App 打包作業指南

本文件專為關貿網路（Trade-van）未來從 PoC 環境轉換至**正式生產環境（Production）**或**替換為公司專屬 Google Firebase 專案憑證**時，提供標準作業程序（SOP）。

---

## 📌 重點觀念：推播配對核心原則（不可忽視的硬性規範）

在 Zulip 的自主推播（Self-Hosted FCM v1）架構中，推播能夠成功抵達手機，依賴**兩端嚴密配對**：

```
[公司 Firebase Console 專案: your-company-firebase]
       │                                     │
       ├─ (1) 下載 google-services.json       └─ (2) 下載 Admin SDK JSON Key
       │                                                     │
       ▼                                                     ▼
 [Android App 客戶端]                                  [Zulip 伺服器端]
 android/app/google-services.json                   /etc/zulip/firebase-adminsdk.json
 (手機向此專案索取 Device Token)                       (Server 拿此金鑰呼叫 FCM 發信)
       │                                                     ▲
       └──────────────── (註冊 Token 登記) ───────────────────┘
```

> [!CAUTION] 兩端專案必須 100% 一致！
> * **禁止混用不同專案**：若 App 使用專案 A 的 `google-services.json`，而 Server 使用專案 B 的金鑰，Google FCM 將直接拒絕發送（報錯：`SENDER_ID_MISMATCH` 或 `UNREGISTERED`）。
> * **Package Name 必須相符**：`google-services.json` 內宣告的 `package_name`，必須與 `android/app/build.gradle` 內的 `applicationId` 完全一致。

---

## 一、 公司端 Firebase 專案建立與憑證取得

請公司管理者或 IT 人員前往 [Google Firebase Console](https://console.firebase.google.com/) 執行以下步驟：

### 步驟 1：建立全新企業專案
1. 點擊「新增專案」，輸入專案名稱（例如：`tradevan-chat-prod`）。
2. 可選擇性啟用 Google Analytics（若無特殊需求可略過），點擊「建立專案」。

### 步驟 2：取得 App 端所需的 `google-services.json`
1. 在專案首頁點擊 **Android 圖示**（新增 Android 應用程式）。
2. 輸入 **Android 套件名稱**（Package Name）：
   - 目前 PoC 預設值為：`com.example.davidpoczulip`
   - 若正式環境變更為關貿官方 ID（例如：`com.tradevan.chat`），請記錄下來。
3. 應用程式暱稱填寫：「關貿通訊」。
4. 點擊「註冊應用程式」後，點擊下載 **`google-services.json`**。

### 步驟 3：取得 Server 端所需的服務帳戶金鑰（Admin SDK JSON）
1. 點擊左上角齒輪圖示 ➡ **「專案設定 (Project settings)」**。
2. 切換至 **「服務帳戶 (Service accounts)」** 分頁。
3. 確認語言選擇為「Python」或「Firebase Admin SDK」。
4. 點擊 **「產生新的私密金鑰 (Generate new private key)」**。
5. 瀏覽器將下載一個名為 `tradevan-chat-prod-firebase-adminsdk-xxxxx.json` 的金鑰檔案，**請妥善保管此金鑰，切勿公開至外網**。

---

## 二、 行動端 App：替換 Firebase 檔案與打包流程

### 步驟 1：替換 `google-services.json`
將剛才在步驟 2 下載的 `google-services.json`，直接覆蓋置換到 App 專案目錄下：
```bash
# 檔案路徑：
appdev/zulip-mobile/android/app/google-services.json
```

### 步驟 2：若有更改 Package Name（若未更改則略過本步）
若公司決定變更套件識別碼（例如改為 `com.tradevan.chat`）：
1. 修改 `android/app/build.gradle`：
   ```groovy
   defaultConfig {
       applicationId "com.tradevan.chat" // 改為新 ID
       ...
   }
   ```
2. 修改 `src/config/enterprise.js` 中的對應常數（若有配置）。

### 步驟 3：重新編譯與打包 Android APK

進入 `appdev/zulip-mobile` 目錄，執行乾淨打包指令：

```bash
cd appdev/zulip-mobile

# 1. 確保 JavaScript 離線獨立 Bundle 最新（含方案 C 與品牌自訂）
yarn bundle-android

# 2. 進入 android 目錄清理舊快取並打包 Debug 或 Release APK
cd android
./gradlew clean

# 打包測試版 (Debug APK)
./gradlew assembleDebug

# 或打包正式簽名版 (Release APK，需先配置 keystore)
# ./gradlew assembleRelease
```

* **產出 APK 路徑**：
  - Debug 版：`android/app/build/outputs/apk/debug/app-debug.apk`
  - Release 版：`android/app/build/outputs/apk/release/app-release.apk`

---

## 三、 伺服器端 (Zulip Server)：替換金鑰與重啟推播引擎

### 步驟 1：上傳新金鑰至伺服器
將在第一階段步驟 3 下載的 `firebase-adminsdk-xxxxx.json` 上傳至伺服器，更名或掛載為 `/etc/zulip/firebase-adminsdk.json`：

```bash
# 若使用 Podman 容器：
podman cp /路徑/tradevan-chat-prod-firebase-adminsdk-xxxxx.json zulip-server:/etc/zulip/firebase-adminsdk.json

# 修正容器內權限為 zulip 專用：
podman exec zulip-server chown zulip:zulip /etc/zulip/firebase-adminsdk.json
podman exec zulip-server chmod 600 /etc/zulip/firebase-adminsdk.json
```

### 步驟 2：檢查 Zulip Server 設定檔 (`/etc/zulip/settings.py`)
確認或加入以下配置：
```python
# 啟用內部推播轉發器 (Self-Hosted Push Bouncer)
ZULIP_SERVICE_PUSH_NOTIFICATION_BOUNCER = True

# 指定 Google Firebase FCM v1 服務帳戶金鑰
FCM_CREDENTIALS_FILE = "/etc/zulip/firebase-adminsdk.json"

# 重要：在生產自建模式下，若尚未配置 Apple APNs，
# 需指派一筆路徑滿足內部檢查，防止系統將 push_notifications_enabled 自動降級
APNS_CERT_FILE = "/etc/zulip/firebase-adminsdk.json"
```

### 步驟 3：重啟後台推播 Worker
```bash
# 重啟推播佇列工作程序
podman exec zulip-server supervisorctl restart 'zulip-workers:*'
podman exec zulip-server supervisorctl restart zulip-django
```

### 步驟 4：執行終端推播發送驗證
透過 Django 管理命令發送測試推播，確認新金鑰能被 Google FCM 正確授權：
```bash
podman exec zulip-server su zulip -c "/home/zulip/deployments/current/manage.py shell -c '
from zerver.lib.push_notifications import send_test_push_notification
from zerver.models import UserProfile
u = UserProfile.objects.filter(delivery_email=\"charlie@david-poc-zulip.ccwu.cc\").first()
print(send_test_push_notification(u))
'"
```
若輸出 `(1, 0)` 且無任何 Exception，代表新金鑰已順利與 Google 完成認證連線！

---

## 四、 測試驗收檢核表 (Verification Checklist)

- [ ] **App 重新登入註冊 Token**：新打好的 APK 安裝後，登入任一帳號，確認 Server 成功存入新 Token：
  ```python
  PushDeviceToken.objects.filter(user=u) # 應有 >= 1 筆紀錄
  ```
- [ ] **背景推播驗證**：將手機 App 按 Home 鍵退至背景，使用 Web 或第二台裝置發送私訊，確認手機跳出橫幅。
- [ ] **多組織推播驗證**：切換至其他組織（例如高鐵專案），確認跨專案推播亦能正常接收。
