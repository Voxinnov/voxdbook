import 'package:flutter/material.dart';
import '../models/transaction_model.dart';
import '../services/transaction_service.dart';

class TransactionProvider with ChangeNotifier {
  List<TransactionModel> _transactions = [];
  bool _isLoading = false;

  List<TransactionModel> get transactions => _transactions;
  bool get isLoading => _isLoading;

  Future<void> fetchTransactions() async {
    _isLoading = true;
    notifyListeners();
    try {
      _transactions = await TransactionService.getTransactions();
    } catch (e) {
      debugPrint(e.toString());
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTransaction(TransactionModel tx) async {
    try {
      await TransactionService.createTransaction(tx);
      await fetchTransactions(); // Refresh list
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTransaction(int id, TransactionModel tx) async {
    try {
      await TransactionService.updateTransaction(id, tx);
      await fetchTransactions();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteTransaction(int id) async {
    try {
      await TransactionService.deleteTransaction(id);
      await fetchTransactions();
    } catch (e) {
      rethrow;
    }
  }
}
