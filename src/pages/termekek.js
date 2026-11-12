import React from "react";
import { withAuth } from "../components/auth";
import { Link } from "react-router-dom";
import Firebase from "firebase";
import { initialize } from "../utils/firebase";
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

import "../styles/admin.css";
import MobileProducts from "../components/MobileProducts";
import { importDemoCatalog } from "../utils/demoCatalog";


class Termekek extends React.Component {
    constructor(props){
        super(props);
        this.state = {
          lista: [],
          searchTerm: '',
          openModal: false,
          selectedItem: '',
          selectedCategory: '',
          selectedQuantitytype: '',
          productName: '',
          ingredients: [{ name: '', quantity: '' }],
          ingredientss: [{ name: '', quantity: '' }],
          price: '',
          ingredientOptions: [],
          ingreDients: [{ name: '', quantity: '' }],
          customCategories: [], 
          newCategoryName: '',
        };
        this.handleAddIngredient = this.handleAddIngredient.bind(this);
        this.handleAddIngredientt = this.handleAddIngredientt.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }



    handleAddIngredient() {
        this.setState(prevState => ({
            ingredients: [...prevState.ingredients, { name: '', quantity: '' }]
        }));
    }
    handleAddIngredientt() {
        this.setState(prevState => ({
            ingreDients: [...prevState.ingreDients, { name: '', quantity: '' }]
        }));
    }
    handleMinusIngredient(index) {
        this.setState(prevState => ({
            ingreDients: prevState.ingreDients.filter((_, i) => i !== index)
        }));
    }
    handleMinusIngredientt(index) {
        this.setState(prevState => ({
            ingredients: prevState.ingredients.filter((_, i) => i !== index)
        }));
    }

    handleInputChange(index, field, value) {
        const newIngredients = [...this.state.ingredients];
        newIngredients[index][field] = value;
        this.setState({
            ingredients: newIngredients
        });
    }
    handleInputChangee(index, field, value) {
        const newIngredients = [...this.state.ingreDients];
        newIngredients[index][field] = value;
        this.setState({
            ingreDients: newIngredients
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const { ingredients, userId } = this.state;
        const ingredientData = ingredients.filter(ing => ing.name).reduce((acc, ing) => {
          acc[ing.name] = Number(ing.quantity);
          return acc;
        }, {});
        if (!this.state.productName.trim() || !this.state.selectedCategory || !Number.isFinite(Number(this.state.price)) || Number(this.state.price) < 0 ||
            Object.values(ingredientData).some(q => !Number.isFinite(q) || q <= 0) ||
            ingredients.some(ing => !ing.name && String(ing.quantity).trim())) {
          alert("Adj meg érvényes terméknevet, árat, kategóriát és alapanyag-mennyiségeket!");
          return;
        }
      
        const warehouseRef = Firebase.database().ref(`warehouse/${userId}`);
        
        warehouseRef.once('value').then(snapshot => {
          const warehouseData = snapshot.val() || {};
      
          // Minden hozzávalót ellenőrzünk
          const missing = [];
      
          Object.entries(ingredientData).forEach(([name, requiredQuantity]) => {
            let found = false;
      
            // Végignézzük az összes raktári elem nevét
            for (const key in warehouseData) {
              const item = warehouseData[key];
      
              if (item.name === name) {
                const currentQuantity = parseFloat(item.quantity);
                if (currentQuantity < requiredQuantity) {
                  missing.push(`${name} - csak ${currentQuantity} van, de ${requiredQuantity} kell`);
                }
                found = true;
                break;
              }
            }
      
            if (!found) {
              missing.push(`${name} nem található a raktárban`);
            }
          });
      
          if (missing.length > 0) {
            alert("Nem sikerült hozzáadni a terméket:\n" + missing.join('\n'));
            return;
          }
      
          // Ha minden hozzávaló rendelkezésre áll → termék mentése
          const productRef = Firebase.database().ref(`sale/${userId}`).push();
          productRef.set({
            nev: this.state.productName,
            ingredients: ingredientData,
            cat: this.state.selectedCategory,
            ar: Number(this.state.price),
          });
      
          // Készlet frissítése (levonás)
          /*Object.entries(ingredientData).forEach(([name, quantityUsed]) => {
            for (const key in warehouseData) {
              const item = warehouseData[key];
              if (item.name === name) {
                const newQuantity = parseFloat(item.quantity) - parseFloat(quantityUsed);
                Firebase.database().ref(`warehouse/${userId}/${key}`).update({ quantity: newQuantity });
                break;
              }
            }
          });*/
      
          // Reset
          this.setState({
            productName: '',
            ingredients: [{ name: '', quantity: '' }],
            price: '',
            selectedCategory: '',
          });
          this.onCloseModall();
      
        });
      }
      






onClickButton = e =>{
    e.preventDefault()
    this.setState({openModal : true})
}

 onCloseModal = ()=>{
     this.setState({openModal : false})
     this.setState({
        selectedItem: '',
        productName: '',
        price: '',})
   }
onClickButtonn = e =>{
    e.preventDefault()
    this.setState({openModall : true})
}

 onCloseModall = ()=>{
     this.setState({openModall : false})
     this.setState({selectedItem: ''})
   }

   componentDidMount() {
    initialize();
  
    Firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const userId = user.uid;
        this.setState({ userId });
  
        // Termékek lekérdezése
        const itemsRef = Firebase.database().ref(`sale/${userId}`);
        itemsRef.on('value', (snapshot) => {
          const items = snapshot.val() || {};
          const newState = Object.keys(items).map((key) => ({
            id: key,
            nev: items[key].nev,
            ar: items[key].ar,
            cat: items[key].cat,
            ingredients: Object.entries(items[key].ingredients || {}).map(([name, quantity]) => ({
              name,
              quantity
            })),
          }));
          this.setState({ lista: newState });
        });

        const categoriesRef = Firebase.database().ref(`categories/${userId}`);
        categoriesRef.on('value', (snapshot) => {
        const categoryList = snapshot.val() || {};
        const categories = Object.values(categoryList);
        this.setState({ customCategories: categories });
        });

  
        // Hozzávalók lekérdezése (warehouse)
        const warehouseRef = Firebase.database().ref(`warehouse/${userId}`);
        warehouseRef.on('value', (snapshot) => {
          const warehouseData = snapshot.val() || {};
          const ingredientNames = [];
  
          Object.values(warehouseData).forEach((item) => {
            // ha a value is egy objektum (mint pl. "teszt alapanyag 2": {...}), akkor végigmegyünk benne is
            if (typeof item === 'object' && !item.name) {
              Object.values(item).forEach((subItem) => {
                if (subItem?.name) {
                  ingredientNames.push(subItem.name);
                }
              });
            } else if (item?.name) {
              ingredientNames.push(item.name);
            }
          });
  
          console.log('Hozzávalók:', ingredientNames);
          this.setState({ ingredientOptions: ingredientNames, warehouseItems: Object.entries(warehouseData).filter(([key, value]) => value && value.name).map(([id, value]) => ({ id, nev: value.name, type: value.type, quantity: value.quantity })) });
        });
      }
    });
  }
  
  


handleUpdateQuantity = () => {
    if (this.state.selectedItem && this.priceInput && this.nevInput) {
      // Convert the ingredients array back to the object structure for Firebase
      const ingredientData = this.state.ingreDients.reduce((acc, ingredient) => {
        if (ingredient.name) acc[ingredient.name] = Number(ingredient.quantity);
        return acc;
      }, {});
  
      // Reference to the Firebase path of the selected item
      const itemRef = Firebase.database().ref(`sale/${this.state.userId}`).child(this.state.selectedItem.id);
  
      // Update Firebase with the new name, price, and ingredients
      itemRef.update({
        nev:  this.nevInput.value,
        ar: Number(this.priceInput.value),
        ingredients: ingredientData,
      })
      .then(() => {
        // If you want to do something after the update is successful, do it here
      })
      .catch(error => {
        // Handle any errors here
        console.error('Update failed:', error);
      });
  
      // Reset the modal state
      this.setState({ openModal: false, selectedItem: null, ingredients: [] });
    } else {
      // Handle the case where the state is not set correctly
      console.error('Missing state information for update');
    }
  }
  

handleAddItem = () => {
    const itemsRef = Firebase.database().ref(`products/${this.state.userId}`);
    const newItem = {
        nev: this.nevInput.value,
        ar: this.priceInput.value,
        quantity: this.quantityInput.value,
        cat: this.state.selectedCategory,
    };
    itemsRef.push(newItem);
    this.onCloseModall();
}

handleDeleteItem = (itemId) => {
    const itemsRef = Firebase.database().ref(`sale/${this.state.userId}`).child(itemId);
    itemsRef.remove();
    this.setState({ openModal: false, selectedItem: null });
}


getQuantityStyle = (quantity) => {
    if (quantity < 10) {
      return {backgroundColor: '#DC5E5E'};
    } else if (quantity >= 10 && quantity < 20) {
      return {backgroundColor: '#E8A86F'};
    } else if (quantity >= 20 && quantity < 30) {
      return {backgroundColor: '#F7F76D'};
    } else {
        return {backgroundColor: '#70B69F'};
    }
  }

  handleEditClick = (item) => {
    this.setState({
      selectedItem: item,
      productName: item.nev,
      price: item.ar,
      ingreDients: item.ingredients,
      openModal: true
    });
  }
  

  

handleSearchChange = (event) => {
    this.setState({ searchTerm: event.target.value });
  };
 
  render() {
    const filteredList = this.state.lista.filter((item) =>
    (item.nev || '').toLowerCase().includes(this.state.searchTerm.toLowerCase())
  );
    
    return (
      <>
      <MobileProducts
        items={this.state.lista}
        categories={this.state.customCategories}
        warehouse={this.state.warehouseItems || []}
        onSave={async (product, editing) => {
          const { userId } = this.state;
          if (!userId) throw new Error("Jelentkezz be!");
          const path = "sale/" + userId;
          const reference = editing ? Firebase.database().ref(path + "/" + product.id) : Firebase.database().ref(path).push();
          const { id, ...data } = product;
          await reference.set(data);
        }}
        onDelete={id => Firebase.database().ref("sale/" + this.state.userId + "/" + id).remove()}
        onAddCategory={async category => {
          const normalized = category.trim();
          if (!normalized) return;
          if (this.state.customCategories.includes(normalized)) return;
          await Firebase.database().ref("categories/" + this.state.userId).push(normalized);
        }}
        onImportDemo={() => importDemoCatalog(Firebase, this.state.userId)}
      />
      <div className="nexa-desktop">
      <div className="main">

        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "60vw"}}>
            <Link style={{textDecoration: "none", color: "grey", fontWeight: "bold"}} to="/admin">Vissza</Link>
            <button className="buttonr" style={{backgroundColor: '#70B69F', width: "150px"}} onClick={this.onClickButtonn}>+</button>
            <input
                type="text"
                placeholder="Keresés..."
                value={this.state.searchTerm}
                onChange={this.handleSearchChange}
                style={{
                    width: '60%',
                  }}
            />
        </div>

        


        <ul className="cucclisttermekek">
          {filteredList.map((item) => {
           return (
              <li  key={item.id}>
                <div className="tetelelistaterme" style={{justifyContent: "space-between"}}>
                  <div className="szamlalomasik"   >{item.nev}</div>
                  <div className="cucclihozzmasik" >{item.ar} Ft</div>
                  <div className="szamlalok" onClick={() => {this.setState({openModal: true}); this.setState({selectedItem: item}); this.handleEditClick(item)}}>edit</div>
                </div>
              </li>
            )
          })}
        </ul>

        <Modal open={this.state.openModal} onClose={this.onCloseModal}>
            <div style={{width: "74vw", height: "70vh"}}>
                <div className="modal-content">
                    <h2>A következő módosítása: {this.state.selectedItem?.nev}</h2>

                    <div style={{display: "flex", flexDirection: "column"}}>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Ár:</label>
                        <div style={{width: "100%"}}>
                            <input
                                className="input"
                                type="number" 
                                placeholder="Price"
                                defaultValue={this.state.selectedItem?.ar}   
                                ref={(input) => this.priceInput = input} 
                            />
                        </div>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Név:</label>
                        <div style={{width: "100%"}}>
                            <input
                                className="input width60p"
                                placeholder="Név"
                                defaultValue={this.state.selectedItem?.nev}   
                                ref={(input) => this.nevInput = input} 
                            />
                        </div>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Hozzávalók módosítása:</label>
                        {this.state.ingreDients.map((ingredient, index) => (
                            <div style={{width: "100%"}} key={index}>
                            <select
                                className="input width60p"
                                style={{margin: 5}}
                                value={ingredient.name}
                                onChange={(e) => this.handleInputChangee(index, 'name', e.target.value)}
                            >
                                <option value="" disabled>Hozzávaló</option>
                                {this.state.ingredientOptions.map((ingredientName, idx) => (
                                    <option key={idx} value={ingredientName}>
                                        {ingredientName}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="input"
                                style={{margin: 5}}
                                type="number"
                                placeholder="Mennyiség"
                                value={ingredient.quantity}
                                onChange={(e) => this.handleInputChangee(index, 'quantity', e.target.value)}
                            />
                            <button onClick={() => this.handleMinusIngredientt(index)}>Eltávolítás</button>
                            </div>
                        ))}
                        <div style={{width: "100%"}}>
                            <button type="button" onClick={this.handleAddIngredientt}>+ hozzávaló</button>
                        </div>
                    </div>
                    <button className="margin" style={{backgroundColor: '#70B69F'}} onClick={this.handleUpdateQuantity}>Frissítés</button>
                    <button className="margin" style={{ backgroundColor: '#DC5E5E' }} onClick={() => this.handleDeleteItem(this.state.selectedItem.id)}>Törlés</button>
                </div>
            </div>
        </Modal>

        <Modal open={this.state.openModall} onClose={this.onCloseModall}>
            <div style={{width: "74vw", height: "75vh"}}>
                <div className="modal-content">
                    <h2>Új termék hozzáadása</h2>

                    <div style={{display: "flex", flexDirection: "column"}}>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}}  htmlFor="quantityInput">Név:</label>
                        <div style={{width: "100%"}}>
                            {/*<input 
                                className="input" 
                                type="number" 
                                defaultValue={this.state.selectedItem?.quantity} 
                                ref={(input) => this.quantityInput = input} 
                            />*/}
                            <input
                                className="input" 
                                placeholder="Név"
                                value={this.state.productName}
                                onChange={(e) => this.setState({ productName: e.target.value })}
                            />
                         </div>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Ár:</label>
                        <div style={{width: "100%"}}>
                            <input
                                className="input"
                                type="number" 
                                placeholder="Ár"
                                value={this.state.price}  
                                onChange={(e) => this.setState({ price: e.target.value })}
                            />
                        </div>
                       
                        {/*<label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Név:</label>
                        <div style={{width: "100%"}}>
                            <input
                                className="input width60p"
                                placeholder="Név"
                                defaultValue={this.state.selectedItem?.nev}   
                                ref={(input) => this.nevInput = input} 
                            />
                        </div>*/}
                        {this.state.ingredients.map((ingredient, index) => (
                        <div style={{margin: 10, fontWeight: "bold"}}  key={index}>
                            <select
                                className="input width60p"
                                style={{margin: 5}}
                                value={ingredient.name}
                                onChange={(e) => this.handleInputChange(index, 'name', e.target.value)}
                            >
                                <option value="" disabled>Hozzávaló</option>
                                {this.state.ingredientOptions.map((ingredientName, idx) => (
                                    <option key={idx} value={ingredientName}>
                                        {ingredientName}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="input"
                                style={{margin: 5}}
                                type="number"
                                placeholder="Mennyiség"
                                value={ingredient.quantity}
                                onChange={(e) => this.handleInputChange(index, 'quantity', e.target.value)}
                            />
                            <button onClick={() => this.handleMinusIngredientt(index)}>Eltávolítás</button>
                        </div>
                    ))}
                    <div style={{width: "100%"}}>
                        <button type="button" onClick={this.handleAddIngredient}>+ hozzávaló</button>
                        </div>
                        <label style={{ marginTop: 20, fontWeight: "bold" }}>Új kategória hozzáadása:</label>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <input
                            className="input"
                            placeholder="Új kategória"
                            value={this.state.newCategoryName}
                            onChange={(e) => this.setState({ newCategoryName: e.target.value })}
                        />
                        <button
                            onClick={() => {
                            if (!this.state.newCategoryName.trim()) return;
                            const categoryRef = Firebase.database().ref(`categories/${this.state.userId}`);
                            categoryRef.push(this.state.newCategoryName.trim());
                            this.setState({ newCategoryName: '' });
                            }}
                            style={{ marginLeft: 10 }}
                        >
                            Hozzáadás
                        </button>
                        </div>
                        <div 
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <select 
                                id="categoryInput"
                                className="input width60p"
                                value={this.state.selectedCategory} 
                                onChange={(e) => this.setState({ selectedCategory: e.target.value })}
                                >
                                <option value="" disabled>Válassz kategóriát</option>
                                {this.state.customCategories.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>

                        </div>
                        


                    </div>

                    
                    {/*<button className="margin" style={{marginTop: 20}} onClick={this.handleAddItem}>Hozzáadás</button>*/}
                    
                    <button className="margin" style={{backgroundColor: "#70B69F"}} onClick={this.handleSubmit}>Hozzáadás</button>
                </div>
            </div>
        </Modal>
        
         
      </div></div>
      </>
    );
  }
}

export default withAuth(Termekek);