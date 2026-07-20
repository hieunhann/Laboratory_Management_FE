import React from "react";
import AuthenTemplate from "../../components/authen-template";

function Login() {
  return (
    <>
      {/* <Navbar_authen /> */}
      <AuthenTemplate isLogin={true}></AuthenTemplate>
    </>
  );
}

export default Login;
