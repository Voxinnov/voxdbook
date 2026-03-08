import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

enum ProductType { voxtree, voxdbook }

class ProductProvider with ChangeNotifier {
  ProductType _activeProduct = ProductType.voxdbook;

  ProductType get activeProduct => _activeProduct;

  ProductProvider() {
    _loadProductFromPrefs();
  }

  Future<void> _loadProductFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final productStr = prefs.getString(Constants.productKey);
    if (productStr != null) {
      _activeProduct = ProductType.values.firstWhere(
        (e) => e.toString() == productStr,
        orElse: () => ProductType.voxdbook,
      );
      notifyListeners();
    }
  }

  Future<void> setActiveProduct(ProductType product) async {
    _activeProduct = product;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(Constants.productKey, product.toString());
    notifyListeners();
  }

  String get currentApiUrl {
    return _activeProduct == ProductType.voxtree
        ? Constants.voxtreeApiUrl
        : Constants.voxdbookApiUrl;
  }
}
