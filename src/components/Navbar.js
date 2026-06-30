import { Link } from "react-router-dom";

function Navbar() {

  return (

    <nav className="navbar">

      <Link to="/" className="logo">
        Navneet Industries
      </Link>

      <div className="nav-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/plastic">
          Plastic Components
        </Link>


      </div>

    </nav>
  );
}

export default Navbar;