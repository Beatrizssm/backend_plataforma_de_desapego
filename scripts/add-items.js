import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Adicionando novos itens ao banco de dados...');

  // Buscar usuários existentes
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.error('❌ Nenhum usuário encontrado. Execute o seed primeiro.');
    process.exit(1);
  }

  // Distribuir itens entre os usuários
  const user1 = users[0];
  const user2 = users[1] || users[0];
  const user3 = users[2] || users[0];

  // Criar 4 novos itens
  const items = [
    {
      title: 'Sofá Retrátil 3 Lugares',
      description: 'Sofá retrátil cinza, 3 lugares, em ótimo estado. Estofado limpo e sem manchas. Perfeito para sala de estar.',
      price: 800.00,
      available: true,
      status: 'DISPONIVEL',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      ownerId: user1.id,
    },
    {
      title: 'PlayStation 4 Slim',
      description: 'PlayStation 4 Slim 500GB, com 2 controles e 5 jogos. Console em perfeito estado, pouco uso.',
      price: 1200.00,
      available: true,
      status: 'DISPONIVEL',
      imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500',
      ownerId: user2.id,
    },
    {
      title: 'Geladeira Brastemp Frost Free',
      description: 'Geladeira Brastemp Frost Free 310L, cor inox. Funcionando perfeitamente, sem barulhos estranhos.',
      price: 1500.00,
      available: true,
      status: 'DISPONIVEL',
      imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500',
      ownerId: user3.id,
    },
    {
      title: 'Kit de Panelas Antiaderente',
      description: 'Kit completo com 5 panelas antiaderentes de diferentes tamanhos. Inclui tampa para cada panela. Pouco uso.',
      price: 180.00,
      available: true,
      status: 'DISPONIVEL',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500',
      ownerId: user1.id,
    },
  ];

  console.log('🔄 Criando itens...');
  
  for (const itemData of items) {
    const item = await prisma.item.create({
      data: itemData,
    });
    console.log(`✅ Item criado: ${item.title} (R$ ${item.price.toFixed(2)})`);
  }

  console.log('\n🎉 4 novos itens adicionados com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao adicionar itens:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

