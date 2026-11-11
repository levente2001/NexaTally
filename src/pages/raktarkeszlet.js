import React from "react";
import { withAuth } from "../components/auth";
import { Link } from "react-router-dom";
import Firebase from "firebase";
import { initialize } from "../utils/firebase";
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

import "../styles/admin.css";


class Raktarkeszlet extends React.Component {
    constructor(props){
        super(props);
        this.state = {
          lista: [],
          searchTerm: '',
          openModal: false,
          selectedItem: '',
          selectedCategory: '',
          selectedQuantitytype: '',
          ingredientName: '',
          quantity: '',
          userId: ''
        };
        this.handleChangeIngredientName = this.handleChangeIngredientName.bind(this);
        this.handleChangeQuantity = this.handleChangeQuantity.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        initialize();

        Firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.setState({ userId: user.uid }, () => {
                    const itemsRef = Firebase.database().ref(`warehouse/${this.state.userId}`);
                    itemsRef.on('value', (snapshot) => {
                        let items = snapshot.val();
                        let newState = [];
                        for (let item in items) {
                            newState.push({
                                id: item,
                                nev: items[item].name,
                                quantity: items[item].quantity,
                                type: items[item].type
                            });
                        }
                        this.setState({ lista: newState });
                    });
                });
            }
        });
    }

    handleChangeIngredientName(e) {
        this.setState({ ingredientName: e.target.value });
    }

    handleChangeQuantity(e) {
        this.setState({ quantity: e.target.value });
    }

    handleSubmit(e) {
        e.preventDefault();
        const warehouseRef = Firebase.database().ref(`warehouse/${this.state.userId}/${this.state.ingredientName}`);
        warehouseRef.set({
            name: this.state.ingredientName,
            quantity: parseFloat(this.state.quantity),
            type: this.state.selectedQuantitytype,
        });
        this.setState({
            ingredientName: '',
            quantity: '',
            selectedQuantitytype: ''
        });
        this.onCloseModall();
    }

    handleUpdateQuantity = () => {
        if (this.state.selectedItem && this.quantityInput && this.ingredientNameInput) {
            const newQuantity = this.quantityInput.value;
            const newIngredientName = this.ingredientNameInput.value;
            const itemsRef = Firebase.database().ref(`warehouse/${this.state.userId}`).child(this.state.selectedItem.id);
            itemsRef.update({ 
                name: newIngredientName,
                quantity: newQuantity 
            });
            this.setState({ openModal: false, selectedItem: null });
        }
    }

    handleDeleteItem = (itemId) => {
        const itemsRef = Firebase.database().ref(`warehouse/${this.state.userId}`).child(itemId);
        itemsRef.remove();
        this.setState({ openModal: false, selectedItem: null });
    }

    onClickButton = e => {
        e.preventDefault();
        this.setState({openModal: true});
    }

    onCloseModal = () => {
        this.setState({openModal: false, selectedItem: ''});
    }

    onClickButtonn = e => {
        e.preventDefault();
        this.setState({openModall: true});
    }

    onCloseModall = () => {
        this.setState({openModall: false});
    }

    getQuantityStyle = (quantity) => {
        if (quantity < 10) return {backgroundColor: '#DC5E5E'};
        if (quantity < 20) return {backgroundColor: '#E8A86F'};
        if (quantity < 30) return {backgroundColor: '#F7F76D'};
        return {backgroundColor: '#70B69F'};
    }

    handleSearchChange = (event) => {
        this.setState({ searchTerm: event.target.value });
    };
 
  render() {
    const filteredList = this.state.lista.filter((item) =>
    item.nev.toLowerCase().includes(this.state.searchTerm.toLowerCase())
  );
    
    return (
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
            const roundedValue = Math.round(item.quantity * 100) / 100;
           return (
              <li  key={item.id}>
                <div className="tetelelistaterme" style={this.getQuantityStyle(item.quantity)}>
                  <div className="szamlalomasik" style={this.getQuantityStyle(item.quantity)}>{item.nev}</div>
                  <div className="cucclihozzmasik" style={this.getQuantityStyle(item.quantity)}> </div>
                  <div className="cucclihozzmasik" style={this.getQuantityStyle(item.quantity)}>{roundedValue} {item.type}</div>
                  <div className="szamlalok" onClick={() => {this.setState({openModal: true}); this.setState({selectedItem: item})}}>edit</div>
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
                      <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}}  htmlFor="quantityInput">Név:</label>
                        <div style={{width: "100%"}}>
                          <input 
                                  className="input width60p"
                                  defaultValue={this.state.selectedItem?.nev} 
                                  ref={(input) => this.ingredientNameInput = input} 
                              />
                        </div>
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}}  htmlFor="quantityInput">Mennyiség:</label>
                        <div style={{width: "100%"}}>
                            <input 
                                className="input" 
                                type="number" 
                                defaultValue={this.state.selectedItem?.quantity} 
                                ref={(input) => this.quantityInput = input} 
                            />
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
                    <h2>Új termék hozzáadása{this.state.selectedItem?.nev}</h2>

                    <div style={{display: "flex", flexDirection: "column"}}>
                        {/*<label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}}  htmlFor="quantityInput">Mennyiség:</label>
                        <div style={{width: "100%"}}>
                            <input 
                                className="input" 
                                type="number" 
                                defaultValue={this.state.selectedItem?.quantity} 
                                ref={(input) => this.quantityInput = input} 
                            />
                        </div>
                        
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Ár:</label>
                        <div style={{width: "100%"}}>
                            <input
                                className="input"
                                type="number" 
                                placeholder="Ár"
                                defaultValue={this.state.selectedItem?.ar}   
                                ref={(input) => this.priceInput = input} 
                            />
                            
                        </div>

                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Mértékegység:</label>
                        <div style={{width: "100%"}}>
                        <select 
                                id="categoryInput"
                                className="input "
                                value={this.state.selectedQuantitytype} 
                                onChange={(e) => this.setState({ selectedQuantitytype: e.target.value })}
                            >
                                <option value="l">l</option>
                                <option value="dl">dl</option>
                                <option value="cl">cl</option>
                                <option value="db">db</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                            </select>

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
                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="categoryInput">Kategória:</label>
                        <div style={{width: "100%"}}>
                            <select 
                                id="categoryInput"
                                className="input width60p"
                                value={this.state.selectedCategory} 
                                onChange={(e) => this.setState({ selectedCategory: e.target.value })}
                            >
                                <option value="meleg">Meleg</option>
                                <option value="üdítők">Üdítők</option>
                                <option value="borok">Borok</option>
                                <option value="koktel">Koktel</option>
                                <option value="rovid2">Rovid2</option>
                                <option value="rovid4">Rovid4</option>
                                <option value="sör">Sör</option>
                                <option value="snack">Snack</option>
                                <option value="jeges italok">Jeges Italok</option>
                            </select>
                        </div>
        */}
                      <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Név:</label>
                      <div style={{width: "100%"}}>
                        <input
                              className="input width60p"
                              placeholder="Név"
                              value={this.state.ingredientName}
                              onChange={this.handleChangeIngredientName}
                          />
                      </div>
                      <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Mennyiség:</label>
                      <div style={{width: "100%"}}>
                        <input
                              className="input"
                              type="number"
                              placeholder="Mennyiség"
                              value={this.state.quantity}
                              onChange={this.handleChangeQuantity}
                          />
                      </div>
                    </div>

                        <label style={{marginTop: 25, marginBottom: 5, fontWeight: "bold"}} htmlFor="priceInput">Mértékegység:</label>
                        <div style={{width: "100%"}}>
                        <select 
                                id="categoryInput"
                                className="input "
                                value={this.state.selectedQuantitytype} 
                                onChange={(e) => this.setState({ selectedQuantitytype: e.target.value })}
                            >
                                <option value="" disabled>Válassz kategóriát</option>
                                <option value="l">l</option>
                                <option value="dl">dl</option>
                                <option value="cl">cl</option>
                                <option value="db">db</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                            </select>

                        </div>

                    
                    <button className="margin" onClick={this.handleSubmit}>Hozzáadás</button>
                </div>
            </div>
        </Modal>

        
         
      </div>
    );
  }
}

export default withAuth(Raktarkeszlet);
