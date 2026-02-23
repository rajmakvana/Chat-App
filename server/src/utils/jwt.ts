import jwt , { JwtPayload } from "jsonwebtoken";

const SECRET = "mysecret";
export const generateToken = ( payload: JwtPayload,): string => {
  return jwt.sign(payload, SECRET, {
    expiresIn: "7d"
  });
};

export const verifyToken = (token : string): JwtPayload => {
  const decode =  jwt.verify(token , SECRET ) as JwtPayload;
  return decode
}