/**
 * 创建管理员脚本
 *
 * 用法: npx tsx scripts/create-admin.ts <username> <password> [role]
 *
 * 参数:
 *   username - 管理员用户名 (3-20 个字符，字母开头)
 *   password - 密码 (至少 6 位)
 *   role     - 角色 (可选，默认 admin，可选值: admin, super_admin)
 *
 * 示例:
 *   npx tsx scripts/create-admin.ts admin admin123
 *   npx tsx scripts/create-admin.ts superadmin admin123 super_admin
 */

import 'dotenv/config';
import { createAdmin } from '../src/lib/admin/auth.js';
import prisma from '../src/lib/prisma.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('用法: npx tsx scripts/create-admin.ts <username> <password> [role]');
    console.error('');
    console.error('示例:');
    console.error('  npx tsx scripts/create-admin.ts admin admin123');
    console.error('  npx tsx scripts/create-admin.ts superadmin admin123 super_admin');
    process.exit(1);
  }

  const [username, password, role = 'admin'] = args;

  if (!['admin', 'super_admin'].includes(role)) {
    console.error('错误: 角色必须是 admin 或 super_admin');
    process.exit(1);
  }

  console.log('正在创建管理员...');
  console.log(`  用户名: ${username}`);
  console.log(`  角色: ${role}`);

  try {
    const result = await createAdmin(username, password, role);

    if (result.success) {
      console.log('');
      console.log('✅ 管理员创建成功！');
      console.log(`  ID: ${result.adminId}`);
      console.log('');
      console.log('现在可以使用以下凭据登录管理后台:');
      console.log(`  用户名: ${username}`);
      console.log(`  密码: ${password}`);
      console.log('  登录地址: /admin/login');
    } else {
      console.error(`❌ 创建失败: ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 创建失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
