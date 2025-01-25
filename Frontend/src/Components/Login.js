import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import Flash from "./Flash";
import Loading from "./Loading";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const formData = {
      username,
      password,
    };

    try {
      const { status } = await login(formData);
      if (status === 200) {
        setIsLoading(false);
        navigate("/dashboard");
      }
    } catch (error) {
      setIsLoading(false);
      setMessage(error.response.data);
    }
  };

  return (
    <>
      <section style={{ height: "100vh" }} className="container-fluid">
        <Flash message={message} setMessage={setMessage} />
        <Loading isLoading={isLoading} />
        <div style={{ height: "100vh" }} className="row">
          <div className="p-0 col-12 col-md-6">
            <div className="authImage"></div>
          </div>
          <div className="px-4 px-md-0 col-12 col-md-6">
            <form onSubmit={handleSubmit} className="authContainer">
              <h1 className="authHeading">Sign In</h1>
              <p className="authSubHeading">
                Access your coaching and athlete management tools.
              </p>
              <div className="authInputGroup mb-4">
                <label htmlFor="email">Email</label>
                <input
                  required
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                />
              </div>
              <div className="authInputGroup">
                <label htmlFor="password">Password</label>
                <input
                  required
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </div>
              <div className="forgotPasswordContainer">
                <Link className="forgotPasswordText" to="#">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" className="authSubmitButton">
                Sign in
              </button>
              <p className="redirectButton">
                Don’t have an account? <Link to="/signup">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
