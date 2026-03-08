class Constants {
  // VOXdBOOK (Smart Daybook) Backend
  static const String voxdbookApiUrl = 'http://192.168.1.4:5000/api';
  
  // VOXTREE Backend
  static const String voxtreeApiUrl = 'http://192.168.1.4:3001/api';
  
  // Default apiUrl for legacy services
  static const String apiUrl = voxdbookApiUrl;
  
  static const String tokenKey = 'jwt_token';
  static const String voxtreeTokenKey = 'voxtree_jwt_token';
  static const String userKey = 'user_data';
  static const String productKey = 'active_product';
}
