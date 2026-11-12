import React from "react";
import { withAuth } from "../components/auth";
import { Link } from "react-router-dom";
import Firebase from "firebase";
import { initialize } from "../utils/firebase";

import "../styles/admin.css";

class Admin extends React.Component {
  constructor(props){
    super(props);
    this.state = {
    };

    this.handleZaras = this.handleZaras.bind(this);
  }

  handleZaras(e) {
    e.preventDefault();
    initialize();
    const itemsRef = Firebase.database().ref('rev');
    itemsRef.remove();
  }
 
  render() {
    
    return (
      <>
      <div className="nexa-mobile nexa-mobile-admin">
        <header className="nexa-mobile-header"><div className="nexa-mobile-brand"><span>Nexa</span>Tally</div><Link className="nexa-role" to="/">Rendelések</Link></header>
        <main className="nexa-mobile-main">
          <div className="nexa-mobile-title-row"><h1>Beállítások</h1></div>
          <div className="nexa-admin-links">
            <Link to="/termekek"><span>◈</span>Termékek <span>›</span></Link>
            <Link to="/raktar"><span>▣</span>Raktárkészlet <span>›</span></Link>
          </div>
          <p className="nexa-form-help" style={{marginTop:22}}>A zárás és nyitás funkció továbbra is a meglévő rendszer szerint működik.</p>
        </main>
        <nav className="nexa-bottom-nav">
          <Link to="/"><span>☷</span>Rendelések</Link>
          <Link to="/"><span>＋</span>Új tétel</Link>
          <Link to="/raktar"><span>▣</span>Készlet</Link>
          <Link className="active" to="/admin"><span>•••</span>Több</Link>
        </nav>
      </div>
      <div className="nexa-desktop">
      <div className="main">
        <div className="cont">
          <Link style={{textDecoration: "none", color: "white"}} to="/termekek">
            <div className="termhozzaadas">Termékek</div>
          </Link>
          <Link style={{textDecoration: "none", color: "white"}} className="egy" to="/raktar">
            <div className="termhozzaadas egy">Raktárkészlet</div>
          </Link>
          <div className="ketto">Zárás</div>
          <div className="harom">Nyitás</div>
        </div>
        
        <Link to="/">Vissza</Link>
         
      </div></div>
      </>
    );
  }
}

export default withAuth(Admin);
