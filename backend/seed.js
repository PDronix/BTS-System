const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      fullName: "Admin User",
      username: "admin",           // ← Thêm dòng này
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log("✅ Tạo user ADMIN thành công!");
  console.log("Username:", user.username);
  console.log("Email:", user.email);
  console.log("Password:", "admin123");
}

main()
  .catch((e) => console.error("Lỗi:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });