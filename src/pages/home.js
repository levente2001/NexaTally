import React from "react";
import { Redirect, Link } from "react-router-dom";
//import ReactModal from 'react-modal';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import { authStates, withAuth } from "../components/auth";
import Firebase from "firebase";
import { signOut, initialize } from "../utils/firebase";
import Loader from "../components/loader";
//import logo from '../mylogo.png';
import emailjs from '@emailjs/browser';
import MobileHome from '../components/MobileHome';

function handleSignOut() {
  signOut()
    .then(() => {
      console.log("Signed Out");
    })
    .catch(e => {
      console.log("Error signing out", e);
    });
}




class Home extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      value: '',
      cimnev: '',
      vendeg: '',
      tetel: '',
      modcat: '',
      price: [],
      ar: '',
      id: '',
      idt: '',
      rev: [],
      items: [],
      termekek: [],
      lista: [],
      nevek: [],
      ter: 0,
      zero: 0,
      bevtl: [],
      user: '',
      dolgozo: '',
      szamlalo: null,
      isVisible: true,
      currentDate: new Date(),
      customCategories: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSubmitTerm = this.handleSubmitTerm.bind(this);
    this.handleSubmitFiz = this.handleSubmitFiz.bind(this);
    this.handleSubmitTetelTorles = this.handleSubmitTetelTorles.bind(this);
    this.handleZaras = this.handleZaras.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }
  
  handleZaras(e) {
    e.preventDefault();
    initialize();
    const itemsRef = Firebase.database().ref(`rev/${this.state.userId}`);
    itemsRef.remove();
    let numbers = this.state.lista
    let result = numbers.filter(item => item.vendeg)
    var templateParams = {
      to_name: "Rebeka",
      from_name1: "Pöpi",
      message1: "Forró csoki, espresso, tej 1 dl",
      from_name2: "Levi",
      message2: "Whiskey cola, GinTonic, Coca-cola",
      from_name3: "Zoli",
      message3: "Ásványvíz, tej, sör",
      from_name4: "Péter",
      message4: "Lottó, tej, bubisvíz",
      
    };
    console.log(result)
    emailjs.send('service_gbavh8e', 'template_gnhu46w', templateParams, 'XThjOXCqFi54k7hk-')
      .then(function(response) {
         console.log('SUCCESS!', response.status, response.text);
      }, function(error) {
         console.log('FAILED...', error);
      });
  }

  sendEmail(e){
    e.preventDefault();
    let numbers = this.state.lista
    let result = numbers.filter(item => item.vendeg)
    console.log(result)
    emailjs.sendForm('service_gbavh8e', 'template_gnhu46w', {message_html: result, from_name: "VárosKútIvó Zárás"}, 'XThjOXCqFi54k7hk-')
      .then((result) => {
          console.log(result.text);
      }, (error) => {
          console.log(error.text);
      });
  };

  

  handleSubmit(e) {
    e.preventDefault();
    initialize();
    const itemsRef = Firebase.database().ref(`items/${this.state.userId}`);
    const item = {
      user: this.state.value
    }
    itemsRef.push(item);
    this.setState({
      value: '',
    });
  }

  handleSubmitFiz(e) {
    e.preventDefault();
    initialize();
    const itemsRef = Firebase.database().ref(`items/${this.state.userId}/${this.state.id}`);
    const itemsRefP = Firebase.database().ref(`tetelek/${this.state.userId}`);
    const itemsRefR = Firebase.database().ref(`rev/${this.state.userId}`);
    let numbers = this.state.lista;
    let result = numbers.filter(item => item.vendeg === this.state.cimnev).reduce((total, currentValue) => total = total + currentValue.ar * currentValue.szamlalo,0);  
    itemsRefR.push({
      vegosszeg: result
    })
    itemsRef.remove()
    itemsRefP.on('value', (snapshot) => {
      let items = snapshot.val();
      for (let item in items) {
        if(items[item].vendeg === this.state.cimnev){
          let id = item
          const delet = Firebase.database().ref(`tetelek/${this.state.userId}/${id}`);
          delet.remove()
        }
      }
    });
    this.setState({openModallll: true})
    window.location.reload(false)
    /*this.setState({
      cimnev: '',
    })*/
  }

  handleSubmitTetelTorles = (e) => {
    e.preventDefault();
    const itemsRef = Firebase.database().ref(`tetelek/${this.state.userId}/${this.state.idt}`);
    const productsRef = Firebase.database().ref(`sale/${this.state.userId}`);
    const warehouseRef = Firebase.database().ref(`warehouse/${this.state.userId}`);
  
    itemsRef.once('value', itemSnapshot => {
      const itemData = itemSnapshot.val();
      if (!itemData) return;
  
      productsRef.orderByChild('nev').equalTo(itemData.tetel).once('value', productSnapshot => {
        const products = productSnapshot.val();
        if (!products) return;
  
        const productId = Object.keys(products)[0];
        const productData = products[productId];
        const ingredients = productData.ingredients || {};
  
        for (let name in ingredients) {
          const totalToReturn = ingredients[name] * (itemData.szamlalo || 1);
          warehouseRef.child(name).once('value').then(snap => {
            const current = snap.val().quantity;
            warehouseRef.child(name).update({ quantity: current + totalToReturn });
          });
        }
  
        itemsRef.remove();
        this.setState({ openModalll: false });
      });
    });
  };
  

  

decrementSzamlalo = (itemId) => {
  const itemRef = Firebase.database().ref(`tetelek/${this.state.userId}/${itemId}`);
  const productsRef = Firebase.database().ref(`sale/${this.state.userId}`);
  const warehouseRef = Firebase.database().ref(`warehouse/${this.state.userId}`);

  itemRef.once('value', itemSnapshot => {
    const itemData = itemSnapshot.val();
    if (!itemData || (itemData.szamlalo || 0) <= 0) return;

    productsRef.orderByChild('nev').equalTo(itemData.tetel).once('value', productSnapshot => {
      const products = productSnapshot.val();
      if (!products) return;

      const productId = Object.keys(products)[0];
      const productData = products[productId];
      const ingredients = productData.ingredients || {};

      for (let name in ingredients) {
        warehouseRef.child(name).once('value').then(snap => {
          const current = snap.val().quantity;
          warehouseRef.child(name).update({ quantity: current + ingredients[name] });
        });
      }

      const newSzamlalo = (itemData.szamlalo || 0) - 1;
      itemRef.update({ szamlalo: newSzamlalo });
      this.setState({ szamlalo: newSzamlalo });
    });
  });
};

  

  incrementSzamlalo = (itemId) => {
    const itemRef = Firebase.database().ref(`tetelek/${this.state.userId}/${itemId}`);
    const productsRef = Firebase.database().ref(`sale/${this.state.userId}`);
    const warehouseRef = Firebase.database().ref(`warehouse/${this.state.userId}`);
  
    itemRef.once('value', itemSnapshot => {
      const itemData = itemSnapshot.val();
      if (!itemData) return;
  
      productsRef.orderByChild('nev').equalTo(itemData.tetel).once('value', productSnapshot => {
        const products = productSnapshot.val();
        if (!products) return;
  
        const productId = Object.keys(products)[0];
        const productData = products[productId];
        const ingredients = productData.ingredients || {};
  
        // Ellenőrzés: van-e elég alapanyag
        const checkPromises = Object.entries(ingredients).map(([name, qty]) => 
          warehouseRef.child(name).once('value').then(snap => {
            const available = snap.val()?.quantity ?? 0;
            if (available < qty) throw new Error(`Nincs elég ${name}`);
          })
        );
  
        Promise.all(checkPromises)
          .then(() => {
            // Ha van elég, frissítjük
            for (let name in ingredients) {
              warehouseRef.child(name).once('value').then(snap => {
                const current = snap.val().quantity;
                warehouseRef.child(name).update({ quantity: current - ingredients[name] });
              });
            }
  
            const newSzamlalo = (itemData.szamlalo || 0) + 1;
            itemRef.update({ szamlalo: newSzamlalo });
            this.setState({ szamlalo: newSzamlalo });
          })
          .catch(err => alert(err.message));
      });
    });
  };
  
  


  handleSubmitTerm() {
    initialize();
    const itemsRef = Firebase.database().ref(`tetelek/${this.state.userId}`);
    const productsRef = Firebase.database().ref(`sale/${this.state.userId}`);
    const warehouseRef = Firebase.database().ref(`warehouse/${this.state.userId}`);
    const { cimnev, tetel, ar, szamlalo } = this.state;

    if(!cimnev) {
      alert(`Nincs kiválasztott vendég`);
      return;
    };
  
    itemsRef.orderByChild('tetel').equalTo(tetel).once('value', snapshot => {
      const matchingItems = snapshot.val();
      let existingItem = null;
      let itemId = null;
  
      if (matchingItems) {
        for (let key in matchingItems) {
          if (matchingItems[key].vendeg === cimnev) {
            existingItem = matchingItems[key];
            itemId = key;
            break;
          }
        }
      }
  
      if (existingItem) {
        const currentSzamlalo = existingItem.szamlalo || 0;
        const incrementedSzamlalo = currentSzamlalo + 1;
  
        itemsRef.child(itemId).update({ szamlalo: incrementedSzamlalo });
      } else {
        const item = {
          vendeg: cimnev,
          tetel: tetel,
          ar: ar,
          szamlalo: szamlalo,
        };
        itemsRef.push(item);
      }
  
      // Update warehouse
      productsRef.orderByChild('nev').equalTo(tetel).once('value', productSnapshot => {
        const products = productSnapshot.val();
        if (products) {
          const productId = Object.keys(products)[0];
          const productData = products[productId];
  
          if (productData.ingredients) {
            for (let ingredientName in productData.ingredients) {
              const requiredQuantity = productData.ingredients[ingredientName];
              warehouseRef.child(ingredientName).once('value', snapshot => {
                const data = snapshot.val();
                if (data) {
                  const newQuantity = data.quantity - requiredQuantity;
                  warehouseRef.child(ingredientName).update({ quantity: newQuantity });
                }
              });
            }
          }
        }
      });

      this.onCloseModal();
  
      // Reset state
      this.setState({
        vendeg: '',
        tetel: '',
        ar: '',
        szamlalo: ''
      });
    });
  }
  

toggleFullScreen() {
  let elem = document.documentElement;

  if (!document.fullscreenElement && !document.mozFullScreenElement &&
      !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (elem.requestFullscreen) {
          elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
      }
  } else {
      if (document.exitFullscreen) {
          document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
      }
  }
}


  onClickButton = e =>{
    e.preventDefault()
    this.setState({openModal : true})
}

onClickButtonnn = e =>{
  e.preventDefault()
  this.setState({openModalll : true})
}
onClickButtonnnn = e =>{
  e.preventDefault()
  this.setState({openModallll : true})
}

onClickBbuttonnnn = e =>{
  e.preventDefault()
  this.setState({openModalllll : true})
}

onCloseModal = ()=>{
  this.setState({openModal : false})
}
onCloseModalll = ()=>{
  this.setState({openModalll : false})
}
onCloseModallll = ()=>{
  this.setState({openModallll : false})
}
onCloseMmodallll = ()=>{
  this.setState({openModalllll : false})
}

componentDidMount() {
  initialize();
  console.log("lefut a componentdidmount");
  Firebase.auth().onAuthStateChanged((user) => {
    this.setState({
      dolgozo: user.email,
      userId: user.uid
    });
    /*if (user.email === 'kalolevente@gmail.com' || user.email === 'lalivaroskut@gmail.com') {
      this.setState({ isVisible: true });
    } else {
      this.setState({ isVisible: false });
    }*/
    const categoriesRef = Firebase.database().ref(`categories/${user.uid}`);
    categoriesRef.on('value', (snapshot) => {
    const categoryList = snapshot.val() || {};
    const categories = Object.values(categoryList);
    this.setState({ customCategories: categories });
    const itemsRef = Firebase.database().ref(`items/${this.state.userId}`);
  const itemsRefT = Firebase.database().ref(`sale/${this.state.userId}`);
  const itemsRefR = Firebase.database().ref(`rev/${this.state.userId}`);
  const itemsRefP = Firebase.database().ref(`tetelek/${this.state.userId}`);
  itemsRefR.on('value', (snapshot) => {
    let items = snapshot.val();
    let ossz = [];
      for (let item in items) {
        ossz.push({
          ossz: items[item].vegosszeg
        });
      }
    
    this.setState({bevtl: ossz});
  });
  itemsRef.on('value', (snapshot) => {
    let items = snapshot.val();
    let newState = [];
    for (let item in items) {
      newState.push({
        id: item,
        user: items[item].user
      });
    }
    this.setState({
      items: newState
    });
  });
  itemsRefT.on('value', (snapshot) => {
    let items = snapshot.val();
    let newState = [];
    for (let item in items) {
      let currentItem = items[item];
      newState.push({
        id: item,
        cat: items[item].cat,
        ar: items[item].ar,
        nev: items[item].nev,
        ingredients: currentItem.ingredients ? Object.entries(currentItem.ingredients).map(([ingName, quantity]) => ({
          name: ingName,
          quantity: quantity
      })) : []
      });
    }
    this.setState({
      termekek: newState
    });
  });

  itemsRefP.on('value', (snapshot) => {
    let items = snapshot.val();
    let newState = [];
    for (let item in items) {
      newState.push({
        id: item,
        ar: items[item].ar,
        tetel: items[item].tetel,
        vendeg: items[item].vendeg,
        szamlalo: items[item].szamlalo,
      });
      this.setState({
        lista: newState
      });
    }
  });
  });
  });
  

  this.timer = setInterval(() => {
    this.setState({ currentDate: new Date() });
  }, 1000);
}

componentWillUnmount() {
  // Időzítő törlése, amikor a komponens eltávolításra kerül
  clearInterval(this.timer);
}


  render() {
    if (this.props.authState === authStates.INITIAL_VALUE) {
      return <Loader />;
    }

    if (this.props.authState === authStates.LOGGED_OUT) {
      return <Redirect to="/login"></Redirect>;
    }
    let numbers = this.state.lista;
    let result = numbers.filter(item => item.vendeg === this.state.cimnev).reduce((total, currentValue) => total = total + currentValue.ar * currentValue.szamlalo,0);           
    let bevtl = this.state.bevtl;
    let resultt = bevtl.reduce((total, currentValue) => total + currentValue.ossz,0);

    const { currentDate } = this.state;
  
    return (
      <>
      <MobileHome
        guests={this.state.items}
        products={this.state.termekek}
        lines={this.state.lista}
        categories={this.state.customCategories}
        selectedGuest={this.state.cimnev}
        employee={this.state.dolgozo}
        revenue={resultt}
        selectGuest={guest => this.setState({ cimnev: guest.user, id: guest.id })}
        createGuest={name => {
          Firebase.database().ref("items/" + this.state.userId).push({ user: name });
        }}
        addProduct={product => this.setState({ szamlalo: 1, ar: product.ar, tetel: product.nev }, () => this.handleSubmitTerm())}
        onIncrement={this.incrementSzamlalo}
        onDecrement={this.decrementSzamlalo}
        onDelete={id => this.setState({ idt: id }, () => this.handleSubmitTetelTorles({ preventDefault() {} }))}
        onPay={() => this.handleSubmitFiz({ preventDefault() {} })}
      />
      <div className="nexa-desktop"><div className="container">
        <div className="grid">
          <div className="innergrid">
            <div className="grid-item lt-radius innergrid-full-button mobilonnemkell">
              {/*<button className="button" onClick={this.handleZaras}> ZÁRÁS </button>*/}
              <button className="fullscreen-button" onClick={this.toggleFullScreen.bind(this)}>Fullscreen</button>
            </div>
            <div className="grid-item innergrid-admin-button">
            {this.state.isVisible && (
              <div className="inner" style={{ width: "100%"}}>
                <Link className="admintext" to="/admin">Admin</Link>
              </div>
            )}
            </div>
            <div className="grid-item dolgozo mobilonnemkell">
              <h2>{this.state.dolgozo}</h2>
            </div>
            <div className="grid-item mobilonnemkell">
              <h2>{currentDate.toLocaleDateString()}</h2>
            </div>
            <div className="grid-item mobilonnemkell">
              <h2>{currentDate.toLocaleTimeString()}</h2>
            </div>
            <div className="grid-item rt-radius innergrid-kijel-button mobilonnemkell ">
            <button style={{ width: "100%", fontSize: "1rem"}} onClick={handleSignOut}> Kijelentkezés </button>
            </div>
          </div>

          <div className="innergrid-secondrow">
            <div className="grid-item mobilonnemkell">
              <p>{resultt} Ft</p>
            </div>
            <div className="grid-item mobilonnemkell">
              <h2 style={{fontSize: "3rem"}}>{this.state.cimnev}</h2>
            </div>

            

            <div className="grid-item innergrid-plus-button">
                <button onClick={this.onClickButton} className="buttonprof"> + </button>
                {this.state.openModal && (
                  <div className="modal" open={this.state.openModal} onClose={this.onCloseModal}>
                    <span className="close" onClick={() => {this.setState({openModal: false})}}>&times;</span>
                    <div className="modal-content">
                    <div className="modd">
                      <div className="szuro">
                        {this.state.customCategories.map((cat, idx) => (
                          <button key={idx} className="modalhozz" onClick={() => this.setState({ modcat: cat })}>
                            {cat}
                          </button>
                        ))}
                      </div>


                    <ul className="termlist">
                      {this.state.termekek.filter(item => item.cat === this.state.modcat).map((item) => {
                        return (
                          <li className="nevekli" onClick={() =>
                            this.setState(
                              {
                                szamlalo: 1,
                                ar: item.ar,
                                tetel: item.nev
                              },
                              () => {
                                this.handleSubmitTerm();
                              }
                            )
                          } key={item.id}>
                            <h4>{item.nev}</h4>
                            <h3>{item.ar} Ft</h3>
                            
                          {/*enis.can.write=prg'name'*/}
                          </li>
                        )
                      })}
                    </ul>

                    </div>

                    
                  {/*<button className="modalhozz" onClick={this.handleSubmitTerm}>Hozzáad</button>*/}
                      
                  </div>
                
                    
                </div>
              )}
            </div>
            <div className="grid-item innergrid-fiz-button">
                <Modal open={this.state.openModalllll} onClose={this.onCloseMmodallll}>
                  <h6>BIZTOSAN FIZET?</h6>
                  <button className="modalhozz" onClick={this.handleSubmitFiz}>FIZET</button>
                  <button className="buttonr" onClick={this.onCloseMmodallll}>MÉGSE</button>
                </Modal>
                <button className="buttonfiz" onClick={this.onClickBbuttonnnn}> Fizetés </button>
            </div>
          </div>

          <div className="innergrid-3rdrow">
            <div className="grid-item vendeglista mobilonnemkell">
              <h2>Vendéglista</h2>
            </div>
            <div className="grid-item-left fizetendo-mobile">
              <h2 className="fizetendo-left-align">Fizetendő: {result} Ft</h2>
            </div>
          </div>

          <div className="innergrid-4throw">
            <div className="grid-item gridlist-padding lb-radius bordernone">
              <form onSubmit={this.handleSubmit}>
                <div className="mobilhozzaad">
                <label>
                  <input type="text" value={this.state.value} placeholder="Vendég neve" onChange={this.handleChange} />
                </label>
                <input className="ipuntplus" type="submit" value="+" />
                </div>
              </form>
              <ul className="gridlist">
                {this.state.items.map((item) => {
                  return (
                    <li className="nevekli" onClick={() => {this.setState({cimnev: item.user}); this.setState({ter: result}); this.setState({id: item.id})}} key={item.id}>
                      {item.user}
                    </li>
                  )
                })}
              </ul>
            </div>
            <div className="grid-item rb-radius">
              <ul className="cucclist">
                {this.state.lista.filter(item => item.vendeg === this.state.cimnev).map((item) => {
                  let szamlalo = item.szamlalo;
                  //const itemsRefs = Firebase.database().ref('tetelek/' + item.id);
                  return (
                  <li  key={item.id}>
                    <div className="tetelelista">
                    <div className="szamlalo">{item.ar * szamlalo} Ft</div>
                    <div className="szamlalo">{szamlalo} db</div>
                    <div className="cucclihozz">{item.tetel}</div>
                    <div className="szamlalop" onClick={() => this.incrementSzamlalo(item.id)}>+</div>
                    <div className="szamlalom" onClick={() => this.decrementSzamlalo(item.id)}>-</div>
                    <div className="szamlalok" onClick={() => {this.setState({openModalll: true}); this.setState({idt: item.id})}}>törlés</div>
                    </div>
                  </li>
                  )
                })}
              </ul>
              {this.state.openModalll && (
                <div className="modal">
                  <div className="modal-content">
                    <span className="close" onClick={() => {this.setState({openModalll: false})}}>&times;</span>
                    <h6>BIZTOSAN TÖRÖLNI AKAROD EZT A TÉTELT?</h6>
                    <button className="modalhozz" onClick={this.handleSubmitTetelTorles}>TÖRLÉS</button>
                  </div>
                </div>
              )}
              
            </div>
          </div>  
        </div>
      </div></div>
      </>
    );
  }
   
}

export default withAuth(Home);
