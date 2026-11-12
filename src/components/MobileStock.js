import React from "react";
import { Link } from "react-router-dom";
import { signOut } from "../utils/firebase";

export default class MobileStock extends React.Component {
  state = { search: "", showLow: false };
  render() {
    const { items, onAdjust, onEdit, onAdd } = this.props;
    const search = this.state.search.toLocaleLowerCase("hu-HU");
    const low = items.filter(item => Number(item.quantity) < 10);
    const filtered = items.filter(item =>
      (!this.state.showLow || Number(item.quantity) < 10) &&
      (item.nev || "").toLocaleLowerCase("hu-HU").includes(search));
    return <div className="nexa-mobile">
      <header className="nexa-mobile-header">
        <div className="nexa-mobile-brand"><span>Nexa</span>Tally</div>
        <div className="nexa-mobile-header-actions">
          <Link to="/admin" className="nexa-role">Admin</Link>
          <button className="nexa-logout" aria-label="Kijelentkezés" onClick={() => signOut()}>⇥</button>
        </div>
      </header>
      <main className="nexa-mobile-main">
        <div className="nexa-mobile-title-row"><h1>▣ Készlet</h1></div>
        <div className="nexa-stock-tools">
          <label className="nexa-search"><span>⌕</span><input placeholder="Termék keresése..." value={this.state.search} onChange={e => this.setState({ search: e.target.value })} /></label>
          <button className="nexa-stock-add" onClick={onAdd}>+ Új</button>
        </div>
        {low.length > 0 && <button type="button" className="nexa-stock-alert" style={{width:"100%",textAlign:"left"}} onClick={() => this.setState({showLow: !this.state.showLow})}>⚠ Alacsony készlet – {low.length} termék {this.state.showLow ? "· Összes mutatása" : "›"}</button>}
        <div className="nexa-stock-list">
          {filtered.map(item => <div className={"nexa-stock-row" + (Number(item.quantity) < 10 ? " low" : "")} key={item.id}>
            <div className="nexa-stock-row-copy"><strong>{item.nev}</strong><small>● {Number(item.quantity).toLocaleString("hu-HU", {maximumFractionDigits:2})} {item.type}</small></div>
            <button aria-label={item.nev + " csökkentése"} onClick={() => onAdjust(item, -1)}>−</button>
            <button aria-label={item.nev + " növelése"} onClick={() => onAdjust(item, 1)}>+</button>
            <button className="nexa-stock-edit" onClick={() => onEdit(item)}>Szerk.</button>
          </div>)}
        </div>
        {!filtered.length && <p className="nexa-empty">Nincs találat.</p>}
      </main>
      <nav className="nexa-bottom-nav" aria-label="Mobil navigáció">
        <Link to="/"><span>☷</span>Rendelések</Link>
        <Link to="/"><span>＋</span>Új tétel</Link>
        <Link to="/raktar" className="active"><span>▣</span>Készlet</Link>
        <Link to="/admin"><span>•••</span>Több</Link>
      </nav>
    </div>;
  }
}
