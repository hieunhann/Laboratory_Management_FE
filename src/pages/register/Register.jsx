import React from "react";
import AuthenTemplate from "../../components/authen-template";

function Register() {
  return (
    <>
      {/* <Navbar_authen /> */}
      <AuthenTemplate isLogin={false}></AuthenTemplate>
    </>
  );
}

export default Register;
