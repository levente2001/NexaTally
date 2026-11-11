import React from "react";
import { Link } from "react-router-dom";
import { signOut } from "../utils/firebase";

const money = value => (Number(value) || 0).toLocaleString("hu-HU") + " Ft";
const orderTotal = list => list.reduce((sum, item) =>
  sum + (Number(item.ar) || 0) * (Number(item.szamlalo) || 0), 0);

export default class MobileHome extends React.Component {
  state = { screen: "orders", search: "", category: "", guestName: "", filter: "active", notice: "" };

  chooseGuest = item => {
    this.props.selectGuest(item);
    this.setState({ screen: "detail", notice: "" });
  };

  addGuest = event => {
    event.preventDefault();
    const name = this.state.guestName.trim();
    if (!name) return;
    this.props.createGuest(name);
    this.setState({ guestName: "", notice: "Vendég hozzáadva. Válaszd ki a listából!" });
  };

  addProduct = item => {
    if (!this.props.selectedGuest) {
      this.setState({ notice: "Először válassz vendéget vagy asztalt!" });
      return;
    }
    this.props.addProduct(item);
    this.setState({ notice: item.nev + " hozzáadva" });
  };

  render() {
    const { guests, products, lines, categories, selectedGuest, employee, revenue,
      onIncrement, onDecrement, onDelete, onPay } = this.props;
    const { screen, search, category, filter, notice } = this.state;
    const selectedLines = lines.filter(item => item.vendeg === selectedGuest);
    const total = orderTotal(selectedLines);
    const searchText = search.toLocaleLowerCase("hu-HU");
    const categoryList = [...new Set([...(categories || []), ...products.map(p => p.cat)].filter(Boolean))];
    const selectedCategory = category || categoryList[0] || "";
    const visibleProducts = products.filter(product =>
      (!selectedCategory || product.cat === selectedCategory) &&
      (product.nev || "").toLocaleLowerCase("hu-HU").includes(searchText));
    const shownGuests = guests.filter(guest =>
      (guest.user || "").toLocaleLowerCase("hu-HU").includes(searchText));
    const openCount = guests.length;
    const title = screen === "new" ? "Új tétel" : screen === "detail" ? selectedGuest || "Rendelés" : "Rendelések";

    return (
      <div className="nexa-mobile">
        <header className="nexa-mobile-header">
          <div className="nexa-mobile-brand"><span>Nexa</span>Tally</div>
          <div className="nexa-mobile-header-actions">
            <Link to="/admin" className="nexa-role">{(employee || "Dolgozó").split("@")[0]}</Link>
            <button type="button" aria-label="Kijelentkezés" className="nexa-logout" onClick={() => signOut()}>⇥</button>
          </div>
        </header>

        <main className="nexa-mobile-main">
          <div className="nexa-mobile-title-row">
            {screen === "detail" || screen === "new" ?
              <button type="button" className="nexa-back" onClick={() => this.setState({ screen: screen === "new" && selectedGuest ? "detail" : "orders", notice: "" })} aria-label="Vissza">‹</button> : null}
            <h1>{title}</h1>
          </div>

          {screen === "orders" && <>
            <div className="nexa-stats">
              <div className="nexa-stat nexa-stat-green"><small>Mai bevétel</small><strong>{money(revenue)}</strong></div>
              <div className="nexa-stat nexa-stat-blue"><small>Nyitott vendégek</small><strong>{openCount}</strong></div>
            </div>
            <div className="nexa-segments" role="group" aria-label="Rendelések szűrése">
              <button className={filter === "active" ? "active" : ""} onClick={() => this.setState({ filter: "active" })}>Aktív ({openCount})</button>
              <button className={filter === "all" ? "active" : ""} onClick={() => this.setState({ filter: "all" })}>Összes</button>
            </div>
            <label className="nexa-search"><span>⌕</span><input placeholder="Vendég vagy asztal keresése..." value={search} onChange={e => this.setState({ search: e.target.value })} /></label>
            {shownGuests.length ? <div className="nexa-orders">
              {shownGuests.map(guest => {
                const guestLines = lines.filter(line => line.vendeg === guest.user);
                const count = guestLines.reduce((sum, line) => sum + (Number(line.szamlalo) || 0), 0);
                return <button type="button" className="nexa-order-card" key={guest.id} onClick={() => this.chooseGuest(guest)}>
                  <div className="nexa-order-icon">♧</div>
                  <div className="nexa-order-content"><strong>{guest.user}</strong><span>{count} tétel</span></div>
                  <div className="nexa-order-right"><span className="nexa-pill">Aktív</span><strong>{money(orderTotal(guestLines))}</strong></div>
                  <span className="nexa-chevron">›</span>
                </button>;
              })}
            </div> : <p className="nexa-empty">{search ? "Nincs találat." : "Még nincs vendég. Hozz létre egyet!"}</p>}
            <form onSubmit={this.addGuest} className="nexa-add-guest">
              <input aria-label="Új vendég vagy asztal neve" value={this.state.guestName} onChange={e => this.setState({ guestName: e.target.value })} placeholder="Új vendég / asztal neve" />
              <button type="submit" aria-label="Vendég hozzáadása">+</button>
            </form>
            <button type="button" aria-label="Új tétel felvétele" className="nexa-fab" onClick={() => this.setState({ screen: "new", search: "", notice: "" })}>+</button>
          </>}

          {screen === "detail" && <>
            <div className="nexa-summary"><span>Fizetendő</span><strong>{money(total)}</strong></div>
            <div className="nexa-lines">
              {selectedLines.length ? selectedLines.map(line => <div key={line.id} className="nexa-line">
                <div className="nexa-line-copy"><strong>{line.tetel}</strong><span>{money(line.ar)} / db</span></div>
                <div className="nexa-quantity">
                  <button type="button" aria-label="Mennyiség csökkentése" onClick={() => onDecrement(line.id)}>−</button>
                  <strong>{Number(line.szamlalo) || 0}</strong>
                  <button type="button" aria-label="Mennyiség növelése" onClick={() => onIncrement(line.id)}>+</button>
                </div>
                <button type="button" className="nexa-remove" aria-label="Tétel törlése" onClick={() => { if (window.confirm("Biztosan törlöd ezt a tételt?")) onDelete(line.id); }}>×</button>
              </div>) : <p className="nexa-empty">Ehhez a vendéghez még nincs tétel.</p>}
            </div>
            <button type="button" className="nexa-primary" onClick={() => this.setState({ screen: "new", search: "", notice: "" })}>+ Tétel hozzáadása</button>
            <button type="button" className="nexa-pay" disabled={!selectedLines.length} onClick={() => { if (window.confirm("Biztosan lezárod és kifizeted a rendelést?")) onPay(); }}>Fizetés · {money(total)}</button>
          </>}

          {screen === "new" && <>
            <div className="nexa-guest-selector">
              <label htmlFor="nexa-guest-select">Vendég / asztal</label>
              <select id="nexa-guest-select" value={selectedGuest || ""} onChange={e => {
                const guest = guests.find(g => g.user === e.target.value);
                if (guest) this.props.selectGuest(guest);
              }}>
                <option value="">Válassz vendéget...</option>
                {guests.map(guest => <option key={guest.id} value={guest.user}>{guest.user}</option>)}
              </select>
            </div>
            <label className="nexa-search"><span>⌕</span><input placeholder="Termék keresése..." value={search} onChange={e => this.setState({ search: e.target.value })} /></label>
            <div className="nexa-categories">
              {categoryList.map(cat => <button type="button" key={cat} className={selectedCategory === cat ? "active" : ""} onClick={() => this.setState({ category: cat })}>{cat}</button>)}
            </div>
            <div className="nexa-products">
              {visibleProducts.map(product => <button type="button" key={product.id} className="nexa-product" onClick={() => this.addProduct(product)}>
                <span className="nexa-product-symbol">◈</span><strong>{product.nev}</strong><span>{money(product.ar)}</span>
              </button>)}
            </div>
            {!visibleProducts.length && <p className="nexa-empty">Nincs ilyen termék a kiválasztott kategóriában.</p>}
            <div className="nexa-cart">
              <div className="nexa-cart-heading"><strong>Rendelés ({selectedLines.reduce((sum, line) => sum + (Number(line.szamlalo) || 0), 0)} tétel)</strong><strong>{money(total)}</strong></div>
              {selectedLines.slice(-3).map(line => <div className="nexa-cart-line" key={line.id}><span>{line.szamlalo} × {line.tetel}</span><strong>{money((Number(line.ar) || 0) * (Number(line.szamlalo) || 0))}</strong></div>)}
              <button type="button" className="nexa-primary" onClick={() => this.setState({ screen: selectedGuest ? "detail" : "orders", search: "", notice: "" })}>✓ Kész, vissza a rendeléshez</button>
            </div>
          </>}
          {notice && <div className="nexa-notice" role="status">{notice}</div>}
        </main>
        <nav className="nexa-bottom-nav" aria-label="Mobil navigáció">
          <button type="button" className={screen === "orders" || screen === "detail" ? "active" : ""} onClick={() => this.setState({ screen: "orders", search: "", notice: "" })}><span>☷</span>Rendelések</button>
          <button type="button" className={screen === "new" ? "active" : ""} onClick={() => this.setState({ screen: "new", search: "", notice: "" })}><span>＋</span>Új tétel</button>
          <Link to="/raktar"><span>▣</span>Készlet</Link>
          <Link to="/admin"><span>•••</span>Több</Link>
        </nav>
      </div>
    );
  }
}
