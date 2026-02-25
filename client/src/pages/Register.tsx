import React, { useContext } from "react";
import AuthContext from "../context/AuthContext";
import api from "../services/api";
import { useForm, type SubmitHandler } from "react-hook-form";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";



type FormData = {
    email: string,
    password: string,
    name: string
};

const Register: React.FC = () => {

    const { authUser } = useContext(AuthContext)!;
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<FormData>({
        defaultValues: {
            email: '',
            password: '',
            name: ''
        }
    });

    const onSubmit: SubmitHandler<FormData> = async (data): Promise<void> => {
        try {
            const response = await api.post('/auth/signup', data);
            const authorizedToken = response.headers["x-authorized"];
              await authUser({
                token: authorizedToken,
                user: response.data.user
              });
              reset();
              navigate("/chat");
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error)
                console.log(error?.response?.data.message || "internal server Error");
            } else {
                console.log("Something Wrong");
            }
            reset();
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">


            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
            >

                <h2 className="text-2xl font-bold text-center mb-6">
                    Login
                </h2>

                {/* userName */}
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">
                        UserName
                    </label>

                    <input
                        type="text"
                        {
                        ...register('name', {
                            required: 'userName is required'
                        })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}
                </div>

                {/* Email */}
                <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">
                        Email
                    </label>

                    <input
                        type="email"
                        {
                        ...register('email', {
                            required: 'email is required'
                        })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.email && <p style={{ color: 'red' }}>{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium">
                        Password
                    </label>

                    <input
                        type="password"
                        {
                        ...register('password', {
                            required: 'password is required',
                            minLength: {
                                value: 6,
                                message: 'password must have 6 character'
                            }
                        })
                        }
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {errors.password && <p style={{ color: 'red' }}>{errors.password.message}</p>}
                </div>

                {/* Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

            </form>

        </div>
    );
};

export default Register;
