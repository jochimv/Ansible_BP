/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

export const BE_IP_ADDRESS = process.env.NEXT_PUBLIC_STAGE === 'development' ? 'localhost' : '127.0.0.1';

export const BE_BASE_URL = `http://${BE_IP_ADDRESS}:4000`;

export const NOT_FOUND_ICON_SX = {
  width: 80,
  height: 80,
};
