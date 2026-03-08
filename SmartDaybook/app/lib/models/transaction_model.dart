class TransactionModel {
  final int id;
  final int? categoryId;
  final double amount;
  final String type; // 'income', 'expense', 'credit', 'debit'
  final String? paymentMethod;
  final String? description;
  final String transactionDate;

  TransactionModel({
    required this.id,
    this.categoryId,
    required this.amount,
    required this.type,
    this.paymentMethod,
    this.description,
    required this.transactionDate,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'],
      categoryId: json['category_id'],
      amount: double.parse(json['amount'].toString()),
      type: json['type'],
      paymentMethod: json['payment_method'],
      description: json['description'],
      transactionDate: json['transaction_date'].toString().substring(0, 10),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category_id': categoryId,
      'amount': amount,
      'type': type,
      'payment_method': paymentMethod,
      'description': description,
      'transaction_date': transactionDate,
    };
  }
}
