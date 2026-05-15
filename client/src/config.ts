// API URL for the backend server
// Update this if switching between production and local development.
// export const API_URL = 'https://raven-v2-production.up.railway.app';

// my home ip: 192.168.1.105
// Local development configuration
// Only change this if testing on a physical device
// phone's router:
// export const LOCAL_NETWORK_IP = '10.35.227.149';
// home:
export const LOCAL_NETWORK_IP = '192.168.1.105';


// API URL for the backend server
export const API_URL = `http://${LOCAL_NETWORK_IP}:3000`;

// Quick guide to find your IP:
// Windows: Run 'ipconfig' in terminal, look for "IPv4 Address"
// Mac/Linux: Run 'ifconfig' or 'ip addr', look for your network adapter 