import type { ImageSourcePropType } from "react-native";

const DEFAULT_ACCOUNT_AVATAR = require("@/assets/images/persona/Mask group.png");

/**
 * 当前账号统一使用的头像资源。
 *
 * 后端目前尚未提供用户头像字段，所以新用户统一显示默认吉祥物。
 * 后续接入头像上传后，只需在这里优先返回后端 URI，各页面无需分别修改。
 */
export function getAccountAvatarSource(_userId?: number): ImageSourcePropType {
  return DEFAULT_ACCOUNT_AVATAR;
}
