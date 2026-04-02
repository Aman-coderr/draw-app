import * as z from "zod";
const passwordSchema = z
  .string()
  .min(8, { message: "Password must contain atleast 8 characters" })
  .regex(/[a-z]/, { message: "Password must have a lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must have a uppercase letter" })
  .regex(/\d/, { message: "Password must have a number" })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain a Special Character",
  });
export const UserSchema = z.object({
  username: z.string().min(5).max(50),
  email: z.string().email(),
  password: passwordSchema,
});
export const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(20),
});
//# sourceMappingURL=zodSchema.js.map
