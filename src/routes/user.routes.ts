import { Router } from 'express';
import { 
  getUsers,
  addUser,
  removeUser,
  patchUser
} from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth';
import { validateUserCreation, validateUserUpdate } from '../validators/user.validator';
import { handleValidationErrors } from '../middleware/validate';

const router = Router();

router.get('/', verifyToken, getUsers);
router.post('/create', validateUserCreation, handleValidationErrors, addUser);
router.delete('/:id', verifyToken, removeUser);
router.patch('/:id', verifyToken, validateUserUpdate, handleValidationErrors, patchUser);

export default router;