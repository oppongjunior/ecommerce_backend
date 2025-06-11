import { INestApplication } from '@nestjs/common';
import {
  clearDatabase,
  createAdmin,
  createCategory,
  createProducts,
  createSuperAdmin,
  createTag,
  createTestApp,
  createUser,
  getAdminToken,
  getSuperAdminToken,
  getUserToken,
  graphqlRequest,
} from '../e2e.utils';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProductsResolver (e2e)', () => {
  let prisma: PrismaService;
  let app: INestApplication;
  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    prisma = testApp.prisma;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Super Admin', () => {
    let categoryId: string;
    let tagId: string;
    let superAdminToken: string;
    beforeAll(async () => {
      await clearDatabase(prisma);
      await createSuperAdmin(prisma);

      const category = await createCategory(prisma);
      categoryId = category.id;

      const tag = await createTag(prisma);
      tagId = tag.id;

      await createProducts(prisma, categoryId);
      superAdminToken = await getSuperAdminToken(app);
    });
    it('should fetch paginated products with filters', async () => {
      const query = `
              query {
                products(paginate: { first: 2 }, filter: { categoryId: "${categoryId}", priceMin: 400.00 }) {
                  edges {
                    node {
                      id
                      name
                      price
                      categoryId
                    }
                  }
                  pageInfo {
                    hasNextPage
                    pageSize
                  }
                }
              }
              `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${superAdminToken}`).expect(200);

      const edges = response.body.data.products.edges;
      expect(edges).toHaveLength(2);
      expect(edges[0].node).toMatchObject({
        id: 'prod2',
        name: 'Phone',
        price: 499.99,
        categoryId,
      });
      expect(response.body.data.products.pageInfo).toMatchObject({
        hasNextPage: false,
        pageSize: 2,
      });
    });
    it('should create a product', async () => {
      const mutation = `
                          mutation {
                            createProduct(input: {
                              name: "Tablet"
                              price: 299.99
                              sku: "TAB123"
                              quantity: 75
                              images: ["tablet.jpg"]
                              isActive: true
                              categoryId: "${categoryId}"
                            }) {
                              id
                              name
                              price
                              sku
                              quantity
                              images
                              isActive
                              categoryId
                            }
                          }
                          `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data?.createProduct).toMatchObject({
        name: 'Tablet',
        price: 299.99,
        sku: 'TAB123',
        quantity: 75,
        images: ['tablet.jpg'],
        isActive: true,
        categoryId,
      });

      const product = await prisma.product.findUnique({
        where: { sku: 'TAB123' },
      });
      expect(product).toBeDefined();
      expect(product!.name).toBe('Tablet');
    });

    it('should fail to create product with duplicate SKU', async () => {
      const mutation = `
                    mutation {
                      createProduct(input: {
                        name: "Duplicate Laptop"
                        price: 999.99
                        sku: "LAP123"
                        quantity: 50
                        images: ["laptop2.jpg"]
                        isActive: true
                        categoryId: "${categoryId}"
                      }) {
                        id
                      }
                    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('SKU');
    });

    it('should fail to create product with invalid category', async () => {
      const mutation = `
    mutation {
      createProduct(input: {
        name: "Invalid Category Product"
        price: 199.99
        sku: "INV123"
        quantity: 10
        images: ["invalid.jpg"]
        isActive: true
        categoryId: "invalid-cat"
      }) {
        id
      }
    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Category');
    });

    it('should fetch product by ID', async () => {
      const query = `
    query {
      product(id: "prod1") {
        id
        name
        price
        sku
        categoryId
      }
    }
    `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${superAdminToken}`).expect(200);

      expect(response.body.data.product).toMatchObject({
        id: 'prod1',
        name: 'Laptop',
        price: 999.99,
        sku: 'LAP123',
        categoryId,
      });
    });

    it('should return null for non-existent product', async () => {
      const query = `
    query {
      product(id: "prod999") {
        id
      }
    }
    `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${superAdminToken}`).expect(200);

      expect(response.body.data.product).toBeNull();
    });

    it('should update a product', async () => {
      const mutation = `
    mutation {
      updateProduct(id: "prod1", input: {
        name: "Updated Laptop"
        price: 1099.99
        sku: "LAP124"
      }) {
        id
        name
        price
        sku
        categoryId
      }
    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.updateProduct).toMatchObject({
        id: 'prod1',
        name: 'Updated Laptop',
        price: 1099.99,
        sku: 'LAP124',
        categoryId,
      });

      const product = await prisma.product.findUnique({
        where: { id: 'prod1' },
      });
      expect(product!.name).toBe('Updated Laptop');
      expect(product!.price.toNumber()).toBe(1099.99);
    });

    it('should fail to update non-existent product', async () => {
      const mutation = `
    mutation {
      updateProduct(id: "prod999", input: {
        name: "Non-existent"
      }) {
        id
      }
    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Product not found');
    });

    it('should archive and restore a product', async () => {
      const archiveMutation = `
    mutation {
      archiveProduct(id: "prod1") {
        id
        isActive
      }
    }
    `;

      const archiveResponse = await graphqlRequest(app, archiveMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(archiveResponse.body.data.archiveProduct).toMatchObject({
        id: 'prod1',
        isActive: false,
      });

      const archivedProduct = await prisma.product.findUnique({
        where: { id: 'prod1' },
      });
      expect(archivedProduct!.isActive).toBe(false);

      const restoreMutation = `
    mutation {
      restoreProduct(id: "prod1") {
        id
        isActive
      }
    }
    `;

      const restoreResponse = await graphqlRequest(app, restoreMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(restoreResponse.body.data.restoreProduct).toMatchObject({
        id: 'prod1',
        isActive: true,
      });

      const restoredProduct = await prisma.product.findUnique({
        where: { id: 'prod1' },
      });
      expect(restoredProduct!.isActive).toBe(true);
    });
    it('should add and remove a tag from a product', async () => {
      const addTagMutation = `
    mutation {
      addTagToProduct(productId: "prod1", tagId: "${tagId}") {
        id
        tags {
          id
          name
        }
      }
    }
    `;

      const addTagResponse = await graphqlRequest(app, addTagMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(addTagResponse.body.data.addTagToProduct).toMatchObject({
        id: 'prod1',
      });

      const productWithTag = await prisma.product.findUnique({
        where: { id: 'prod1' },
        include: { tags: true },
      });

      expect(productWithTag!.tags).toHaveLength(1);

      const removeTagMutation = `
    mutation {
      removeTagFromProduct(productId: "prod1", tagId: "${tagId}") {
        id
        tags {
          id
        }
      }
    }
    `;

      const removeTagResponse = await graphqlRequest(app, removeTagMutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(removeTagResponse.body.data.removeTagFromProduct).toMatchObject({
        id: 'prod1',
        tags: [],
      });

      const productWithoutTag = await prisma.product.findUnique({
        where: { id: 'prod1' },
        include: { tags: true },
      });
      expect(productWithoutTag!.tags).toHaveLength(0);
    });

    it('should fail to add non-existent tag', async () => {
      const mutation = `
                    mutation {
                      addTagToProduct(productId: "prod1", tagId: "tag999") {
                        id
                      }
                    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Tag');
    });

    it('should delete a product', async () => {
      const mutation = `
    mutation {
      removeProduct(id: "prod1") {
        id
      }
    }
    `;

      const response = await graphqlRequest(app, mutation)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.removeProduct).toMatchObject({
        id: 'prod1',
      });

      const product = await prisma.product.findUnique({
        where: { id: 'prod1' },
      });
      expect(product).toBeNull();
    });
  });

  describe('Admin', () => {
    let categoryId: string;
    let adminToken: string;
    beforeAll(async () => {
      await clearDatabase(prisma);
      await createAdmin(prisma);

      const category = await createCategory(prisma);
      categoryId = category.id;

      await createProducts(prisma, categoryId);
      adminToken = await getAdminToken(app);
    });
    it('should fetch paginated products', async () => {
      const query = `
    query {
      products(paginate: { first: 10 }) {
        edges {
          node {
            id
            name
            price
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
    `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(response.body.data.products.edges).toHaveLength(2);
    });
    it('should create a product', async () => {
      const mutation = `
            mutation {
              createProduct(input: {
                name: "Smartwatch"
                price: 199.99
                sku: "WAT123"
                quantity: 30
                images: ["smartwatch.jpg"]
                isActive: true
                categoryId: "${categoryId}"
              }) {
                id
                name
                price
                sku
                categoryId
              }
            }
    `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${adminToken}`).expect(200);

      expect(response.body.data.createProduct).toMatchObject({
        name: 'Smartwatch',
        price: 199.99,
        sku: 'WAT123',
        categoryId,
      });

      const product = await prisma.product.findUnique({
        where: { sku: 'WAT123' },
      });
      expect(product).toBeDefined();
    });

    it('should update a product', async () => {
      const mutation = `
    mutation {
      updateProduct(id: "prod2", input: {
        name: "Updated Phone"
        price: 599.99
      }) {
        id
        name
        price
        sku
      }
    }
    `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${adminToken}`).expect(200);

      expect(response.body.data.updateProduct).toMatchObject({
        id: 'prod2',
        name: 'Updated Phone',
        price: 599.99,
        sku: 'PHN123',
      });

      const product = await prisma.product.findUnique({
        where: { id: 'prod2' },
      });
      expect(product!.name).toBe('Updated Phone');
    });

    it('should archive a product', async () => {
      const mutation = `
          mutation {
            archiveProduct(id: "prod2") {
              id
              isActive
            }
          }
    `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${adminToken}`).expect(200);

      expect(response.body.data.archiveProduct).toMatchObject({
        id: 'prod2',
        isActive: false,
      });

      const product = await prisma.product.findUnique({
        where: { id: 'prod2' },
      });
      expect(product!.isActive).toBe(false);
    });
  });
  describe('User', () => {
    let categoryId: string;
    let tagId: string;
    let userToken: string;
    beforeAll(async () => {
      await clearDatabase(prisma);
      await createUser(prisma);

      const category = await createCategory(prisma);
      categoryId = category.id;

      const tag = await createTag(prisma);
      tagId = tag.id;

      await createProducts(prisma, categoryId);
      userToken = await getUserToken(app);
    });
    it('should fetch paginated products', async () => {
      const query = `
              query {
                products(paginate: { first: 2 }, filter: { search: "Laptop" }) {
                  edges {
                    node {
                      id
                      name
                      price
                    }
                  }
                  pageInfo {
                    hasNextPage
                  }
                }
              }
  `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.data.products.edges).toHaveLength(1);
      expect(response.body.data.products.edges[0].node).toMatchObject({
        id: 'prod1',
        name: 'Laptop',
        price: 999.99,
      });
    });

    it('should fetch product by ID', async () => {
      const query = `
  query {
    product(id: "prod2") {
      id
      name
      price
      sku
    }
  }
  `;

      const response = await graphqlRequest(app, query).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.data.product).toMatchObject({
        id: 'prod2',
        name: 'Phone',
        price: 499.99,
        sku: 'PHN123',
      });
    });

    it('should NOT create a product (forbidden)', async () => {
      const mutation = `
      mutation {
        createProduct(input: {
          name: "Unauthorized Product"
          price: 99.99
          sku: "UNAUTH123"
          quantity: 10
          images: ["unauth.jpg"]
          isActive: true
          categoryId: "${categoryId}"
        }) {
          id
        }
      }
  `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT update a product (forbidden)', async () => {
      const mutation = `
          mutation {
            updateProduct(id: "prod1", input: {
              name: "Hacked Product"
            }) {
              id
            }
          }
  `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT delete a product (forbidden)', async () => {
      const mutation = `
        mutation {
          removeProduct(id: "prod1") {
            id
          }
        }
  `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT archive a product (forbidden)', async () => {
      const mutation = `
          mutation {
            archiveProduct(id: "prod1") {
              id
            }
          }
  `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT add a tag to a product (forbidden)', async () => {
      const mutation = `
        mutation {
          addTagToProduct(productId: "prod1", tagId: "${tagId}") {
            id
          }
        }
  `;

      const response = await graphqlRequest(app, mutation).set('Authorization', `Bearer ${userToken}`).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });

    it('should NOT access protected routes without token', async () => {
      const query = `
        query {
          products(paginate: { first: 10 }) {
            edges {
              node {
                id
              }
            }
          }
        }
  `;

      const response = await graphqlRequest(app, query).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });
});
