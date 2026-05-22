import { ProductsList } from "../../../components/ProductsList";
import { listProducts } from "../../../lib/products";

export default async function ProductsPage() {
  const products = await listProducts();
  return (
    <section>
      <h1>Products</h1>
      <ProductsList products={products} />
    </section>
  );
}
