/* @flow strict-local */

/**
 * 關貿企業客製設定
 */
export const ENTERPRISE_CONFIG = {
  // 企業 App 顯示名稱
  appName: '關貿通訊',

  // 總部預設伺服器完整網址
  hqServerUrl: 'https://david-poc-zulip.ccwu.cc',

  // 專案子網域之基礎網域 (例如 t-ex-core 會拼成 https://t-ex-core.david-poc-zulip.ccwu.cc)
  baseDomain: 'david-poc-zulip.ccwu.cc',

  // 常用專案代碼提示映射
  knownProjects: {
    't-ex-core': '台灣高鐵專案空間',
  },
};
