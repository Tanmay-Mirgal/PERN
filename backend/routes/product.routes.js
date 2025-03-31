import { Router} from "express"
import { createProducts, deleteProducts, getProducts, getProductsByID, updateProducts } from "../controllers/product.controller.js";

const router = Router();

router.get('/',getProducts);
router.post('/create',createProducts);
router.post('/:id',updateProducts);
router.delete('/:id',deleteProducts);
router.get('/:id',getProductsByID);

export default router;