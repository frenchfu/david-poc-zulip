/* @flow strict-local */
import { PixelRatio } from 'react-native';

import template from './template';
import type { UserOrBot } from '../../types';

const typingAvatar = (realm: URL, user: UserOrBot): string => template`
<div class="avatar" style="width: 38px; height: 38px; min-width: 38px; margin-right: 12px;">
  <img
    class="avatar-img"
    style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;"
    data-sender-id="${user.user_id}"
    src="${user.avatar_url
      .get(
        // 38 logical pixels to match web app style
        PixelRatio.getPixelSizeForLayoutSize(38),
      )
      .toString()}">
</div>
`;

export default (realm: URL, users: $ReadOnlyArray<UserOrBot>): string => template`
  $!${users.map(user => typingAvatar(realm, user)).join('')}
  <div class="content">
    <span></span>
    <span></span>
    <span></span>
  </div>
`;
