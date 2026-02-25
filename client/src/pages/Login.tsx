import { AxiosError } from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../services/api";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";

interface FormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [authorizedToken, setAuthorizedToken] = useState<string | null>(null);

  const { authUser } = useContext(AuthContext)!;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (authorizedToken) {
      socket.auth = {
        token: authorizedToken,
      };
      socket.connect();
      navigate("/chat");
    }
  }, [authorizedToken, navigate]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post("/auth/signin", data);
      const token = response.headers["x-authorized"];
      await authUser({
        token: token,
        user: response.data.user,
      });

      setAuthorizedToken(token);
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        console.log(error?.response?.data.message || "internal server Error");
      } else {
        console.error("Something Wrong");
      }
      reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Email</label>

          <input
            type="email"
            {...register("email", {
              required: "email is required",
            })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {errors.email && (
            <p style={{ color: "red" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Password</label>

          <input
            type="password"
            {...register("password", {
              required: "password is required",
              minLength: {
                value: 6,
                message: "password must have 6 character",
              },
            })}
            disabled={isSubmitting}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {errors.password && (
            <p style={{ color: "red" }}>{errors.password.message}</p>
          )}
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
