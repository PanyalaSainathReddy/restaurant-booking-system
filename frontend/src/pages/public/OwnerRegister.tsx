import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import api from "../../utils/api";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const OwnerRegister = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await api.post("/auth/register/owner", {
        full_name: data.fullName,
        email: data.email,
        password: data.password,
      });
      toast.success("Registration successful! Please log in.");
      navigate("/OwnerLogin");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Restaurant Owner Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/OwnerLogin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              id="fullName"
              label="Owner Full Name"
              error={errors.fullName?.message}
              {...register("fullName")}
            />

            <Input
              id="email"
              type="email"
              label="Email address"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Register
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OwnerRegister;
