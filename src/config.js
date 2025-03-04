class Config {
  constructor() {
    this.baseURL = 'https://nodepay.org';
    this.ipCheckURL = 'https://ipinfo.io/json';
    this.pingURL = 'http://nw.nodepay.org/api/network/ping';
    this.retryInterval = 30000;
    this.sessionURL = 'http://api.nodepay.org/api/auth/session';
  }
}

module.exports = Config;
