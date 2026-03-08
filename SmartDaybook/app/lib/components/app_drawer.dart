import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/theme.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final activeProduct = productProvider.activeProduct;

    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              color: AppTheme.darkSurface,
            ),
            accountName: Text(authProvider.user?['name'] ?? 'User'),
            accountEmail: Text(authProvider.user?['email'] ?? ''),
            currentAccountPicture: CircleAvatar(
              backgroundColor: AppTheme.primaryRed,
              child: Text(
                (authProvider.user?['name']?[0] ?? 'U').toUpperCase(),
                style: const TextStyle(color: Colors.white, fontSize: 24),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black12,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  _buildProductToggle(
                    context,
                    label: 'VOXTREE',
                    isActive: activeProduct == ProductType.voxtree,
                    onTap: () => productProvider.setActiveProduct(ProductType.voxtree),
                  ),
                  _buildProductToggle(
                    context,
                    label: 'VOXdBOOK',
                    isActive: activeProduct == ProductType.voxdbook,
                    onTap: () => productProvider.setActiveProduct(ProductType.voxdbook),
                  ),
                ],
              ),
            ),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.dashboard),
            title: const Text('Dashboard'),
            onTap: () => Navigator.pop(context),
          ),
          if (activeProduct == ProductType.voxdbook) ...[
            ListTile(
              leading: const Icon(Icons.book),
              title: const Text('Daybook'),
              onTap: () => Navigator.pushNamed(context, '/daybook'),
            ),
            ListTile(
              leading: const Icon(Icons.check_box),
              title: const Text('To-Do'),
              onTap: () => Navigator.pushNamed(context, '/todo'),
            ),
          ],
          if (activeProduct == ProductType.voxtree) ...[
             ListTile(
              leading: const Icon(Icons.folder),
              title: const Text('Projects'),
              onTap: () {
                Navigator.pop(context);
                // In a real app, we might need to change the tab index in MainNavigation
                // but for now we assume this drawer is used within MainNavigation
              },
            ),
          ],
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              authProvider.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildProductToggle(BuildContext context, {
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? AppTheme.primaryRed : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isActive ? [
              BoxShadow(
                color: AppTheme.primaryRed.withOpacity(0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              )
            ] : [],
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isActive ? Colors.white : Colors.grey,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
