import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import Flash from "./Flash";
import Loading from "./Loading";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (confirmPassword !== password) {
      setIsLoading(false);
      return setMessage({ error: "Password Doesnot match!" });
    }

    const formData = {
      fullName,
      username,
      password,
    };

    try {
      const { status } = await register(formData);
      if (status === 201) {
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
            <div className="authImageSignup"></div>
          </div>
          <div className="px-4 px-md-0 col-12 col-md-6">
            <form onSubmit={handleSubmit} className="authContainer">
              <h1 className="authHeading">Sign up</h1>
              <p className="authSubHeadingSignup">
                Create an Account and get Access to your personalised Player
                building Tool!
              </p>
              <div className="authInputGroup mb-4">
                <label for="name">Full name</label>
                <input
                  required
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  onChange={(e) => setFullName(e.target.value)}
                  value={fullName}
                />
              </div>
              <div className="authInputGroup">
                <label for="email">Email address</label>
                <input
                  required
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                />
              </div>
              <div className="authInputGroup my-4">
                <label for="password">Password</label>
                <input
                  required
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </div>
              <div className="authInputGroup mb-5">
                <label for="confirmPassword">Confirm Password</label>
                <input
                  required
                  id="confirmPassword"
                  type="password"
                  placeholder="Enter confirm password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                />
              </div>
              <button type="submit" className="authSubmitButton">
                Create account
              </button>
              <p className="redirectButton">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
