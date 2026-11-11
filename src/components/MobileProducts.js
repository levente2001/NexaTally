import React from "react";
import { Link } from "react-router-dom";
import { signOut } from "../utils/firebase";

const money = n => (Number(n) || 0).toLocaleString("hu-HU") + " Ft";

export default class MobileProducts extends React.Component {
  state = { search: "", form: null, editId: null, name: "", price: "", category: "", ingredients: [{ name: "", quantity: "" }], newCategory: "", busy: false };

  openNew = () => this.setState({ form: "new", editId: null, name: "", price: "", category: "", ingredients: [{ name: "", quantity: "" }], newCategory: "" });
  openEdit = item => this.setState({ form: "edit", editId: item.id, name: item.nev, price: String(item.ar), category: item.cat || "", ingredients: (item.ingredients || []).length ? item.ingredients.map(x => ({...x})) : [{ name: "", quantity: "" }], newCategory: "" });
  changeIngredient = (index, field, value) => this.setState(prev => ({
    ingredients: prev.ingredients.map((item, i) => i === index ? { ...item, [field]: value } : item)
  }));
  save = async e => {
    e.preventDefault();
    const { name, price, category, ingredients, form, editId } = this.state;
    const amount = Number(price);
    if (!name.trim() || !category || !Number.isFinite(amount) || amount < 0) {
      this.setState({ error: "Adj meg nevet, érvényes árat és kategóriát." }); return;
    }
    const cleaned = ingredients.filter(x => x.name);
    const names = cleaned.map(x => x.name);
    if (new Set(names).size !== names.length || cleaned.some(x => !Number.isFinite(Number(x.quantity)) || Number(x.quantity) <= 0)) {
      this.setState({ error: "Az alapanyagok mennyisége legyen pozitív, és ne szerepeljen kétszer ugyanaz." }); return;
    }
    if (ingredients.some(x => !x.name && String(x.quantity).trim())) {
      this.setState({ error: "Válassz alapanyagot a megadott mennyiséghez." }); return;
    }
    this.setState({busy:true, error:""});
    try {
      await this.props.onSave({ id: editId, nev: name.trim(), ar: amount, cat: category, ingredients: Object.fromEntries(cleaned.map(x => [x.name, Number(x.quantity)])) }, form === "edit");
      this.setState({ form: null, busy: false });
    } catch(err) { this.setState({busy:false, error:err.message || "Nem sikerült menteni."}); }
  };
  addCategory = async e => {
    e.preventDefault();
    const name = this.state.newCategory.trim();
    if (!name) return;
    try {
      await this.props.onAddCategory(name);
      this.setState({ category: name, newCategory: "", error: "" });
    } catch (err) { this.setState({ error: err.message || "Nem sikerült menteni a kategóriát." }); }
  };
  importDemo = async () => {
    if (!window.confirm("15 demótermék és 15 alapanyag felvétele a saját készletedbe? A meglévő azonos nevű tételeket nem írjuk felül.")) return;
    this.setState({busy:true, error:""});
    try {
      const summary = await this.props.onImportDemo();
      this.setState({ busy:false, message: summary.productCount + " termék és " + summary.ingredientCount + " alapanyag importálva." });
    } catch(err) { this.setState({busy:false, error:err.message || "Az import sikertelen."}); }
  };
  render() {
    const { items, categories, warehouse, onDelete } = this.props;
    const { form, search, name, price, category, ingredients, busy, error, message } = this.state;
    const filtered = items.filter(item => (item.nev || "").toLocaleLowerCase("hu-HU").includes(search.toLocaleLowerCase("hu-HU")));
    return <div className="nexa-mobile">
      <header className="nexa-mobile-header">
        <div className="nexa-mobile-brand"><span>Nexa</span>Tally</div>
        <div className="nexa-mobile-header-actions"><Link className="nexa-role" to="/admin">Admin</Link><button className="nexa-logout" aria-label="Kijelentkezés" onClick={() => signOut()}>⇥</button></div>
      </header>
      <main className="nexa-mobile-main">
        <div className="nexa-mobile-title-row"><h1>Termékek</h1></div>
        <div className="nexa-stock-tools">
          <label className="nexa-search"><span>⌕</span><input placeholder="Termék keresése..." value={search} onChange={e => this.setState({search:e.target.value})}/></label>
          <button className="nexa-stock-add" onClick={this.openNew}>+ Új</button>
        </div>
        <div className="nexa-product-list">
          {filtered.map(item => <button className="nexa-product-row" key={item.id} onClick={() => this.openEdit(item)}>
            <div className="nexa-product-avatar">◈</div>
            <div className="nexa-product-row-info"><strong>{item.nev}</strong><small>{item.cat || "Kategória nélkül"} · {(item.ingredients || []).length} alapanyag</small></div>
            <strong>{money(item.ar)}</strong><span className="nexa-chevron">›</span>
          </button>)}
          {!filtered.length && <p className="nexa-empty">Nincs találat. Adj hozzá egy terméket!</p>}
        </div>
        <button className="nexa-secondary" onClick={this.importDemo} disabled={busy}>15 demótermék és alapanyag importálása</button>
        {message && <p className="nexa-feedback" role="status">{message}</p>}
        {!form && error && <p className="nexa-error" role="alert">{error}</p>}
      </main>
      <nav className="nexa-bottom-nav">
        <Link to="/"><span>☷</span>Rendelések</Link>
        <Link to="/"><span>＋</span>Új tétel</Link>
        <Link to="/raktar"><span>▣</span>Készlet</Link>
        <Link to="/admin" className="active"><span>•••</span>Több</Link>
      </nav>
      {form && <div className="nexa-mobile-overlay" role="presentation" onMouseDown={e => {if(e.target === e.currentTarget) this.setState({form:null,error:""});}}>
        <div className="nexa-mobile-dialog" role="dialog" aria-modal="true" aria-label={form === "edit" ? "Termék szerkesztése" : "Új termék"}>
          <div className="nexa-dialog-header"><h2>{form === "edit" ? "Termék szerkesztése" : "Új termék"}</h2><button aria-label="Bezárás" onClick={() => this.setState({form:null,error:""})}>×</button></div>
          <form onSubmit={this.save} className="nexa-mobile-form">
            <label>Termék neve<input required value={name} placeholder="Pl. Limonádé 0,5 l" onChange={e => this.setState({name:e.target.value})}/></label>
            <label>Ár (Ft)<input required min="0" type="number" value={price} placeholder="1490" onChange={e => this.setState({price:e.target.value})}/></label>
            <label>Kategória<select required value={category} onChange={e => this.setState({category:e.target.value})}><option value="">Válassz kategóriát</option>{categories.map(cat=><option value={cat} key={cat}>{cat}</option>)}</select></label>
            <div className="nexa-inline-category">
              <input aria-label="Új kategória" value={this.state.newCategory} placeholder="Új kategória..." onChange={e=>this.setState({newCategory:e.target.value})}/>
              <button type="button" onClick={this.addCategory}>Hozzáadás</button>
            </div>
            <h3>Recept – alapanyagok</h3>
            <p className="nexa-form-help">A mennyiség a raktárban használt mértékegységben értendő (például víz: 0,4 l).</p>
            {ingredients.map((ingredient,index)=><div className="nexa-ingredient-card" key={index}>
              <label>Alapanyag<select value={ingredient.name} onChange={e=>this.changeIngredient(index,"name",e.target.value)}><option value="">Válassz alapanyagot</option>{warehouse.map(item=><option key={item.id} value={item.nev}>{item.nev} ({item.type})</option>)}</select></label>
              <div className="nexa-ingredient-quantity"><label>Mennyiség<input type="number" min="0.0001" step="any" value={ingredient.quantity} onChange={e=>this.changeIngredient(index,"quantity",e.target.value)}/></label><button type="button" aria-label="Alapanyag eltávolítása" onClick={()=>this.setState({ingredients:ingredients.filter((_,i)=>i!==index)})}>×</button></div>
            </div>)}
            <button type="button" className="nexa-secondary" onClick={()=>this.setState({ingredients:[...ingredients,{name:"",quantity:""}]})}>+ Alapanyag hozzáadása</button>
            {error && <p className="nexa-error" role="alert">{error}</p>}
            <button type="submit" className="nexa-primary" disabled={busy}>{busy ? "Mentés..." : form === "edit" ? "✓ Módosítás mentése" : "✓ Termék hozzáadása"}</button>
            {form === "edit" && <button type="button" className="nexa-danger-link" disabled={busy} onClick={async()=>{if (!window.confirm("Biztosan törlöd a terméket?")) return;this.setState({busy:true});try{await onDelete(this.state.editId);this.setState({form:null,busy:false});}catch(err){this.setState({error:err.message,busy:false});}}}>Termék törlése</button>}
          </form>
        </div>
      </div>}
    </div>;
  }
}
