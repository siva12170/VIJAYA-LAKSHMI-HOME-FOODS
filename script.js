/* ================= STORAGE ================= */
let items = JSON.parse(localStorage.getItem("items")) || [];
let itemSales = JSON.parse(localStorage.getItem("itemSales")) || {};
let orders = JSON.parse(localStorage.getItem("orders")) || [];

/* MULTI CUSTOMER */
let customers = [];
let activeCustomerId = null;

/* DOM */ 
const sweetsEl = document.getElementById("sweets");
const hotEl = document.getElementById("hotItems");
const billBody = document.getElementById("billBody");
const billTotalEl = document.getElementById("billTotal");
const customerTabs = document.getElementById("customerTabs");

/* INIT */
init();
startClock();
renderOrders();

/* ================= INIT ================= */
function init(){
  renderItems();
  bindNav();
  if(customers.length === 0) addCustomer(); // default customer
}

/* ================= CLOCK ================= */
function startClock(){
  setInterval(()=>{
    dateTime.innerText = new Date().toLocaleString();
  },1000);
  billNo.innerText = Math.floor(1000 + Math.random()*9000);
}

/* ================= NAVBAR ================= */
function bindNav(){
  document.querySelectorAll(".nav-btn").forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
      document.getElementById(b.dataset.target).classList.remove("hidden");
      if(b.dataset.target==="daily") renderDaily();
      if(b.dataset.target==="monthly") renderMonthly();
    };
  });
}

/* ================= ADD ITEM ================= */
addItemBtn.onclick=()=>{
  if(!itemName.value) return;

  const f=document.createElement("input");
  f.type="file"; f.accept="image/*";
  f.onchange=()=>{
    const r=new FileReader();
    r.onload=()=>{
      items.push({
        id:items.length+1,
        name:itemName.value,
        category:itemCategory.value,
        priceKg:+priceKg.value||0,
        pricePiece:+pricePiece.value||0,
        img:r.result
      });
      localStorage.setItem("items",JSON.stringify(items));
      itemName.value=priceKg.value=pricePiece.value="";
      renderItems();
    };
    r.readAsDataURL(f.files[0]);
  };
  f.click();
};

/* ================= ITEMS (DRAG + CLICK) ================= */
let dragIndex=null;

function renderItems(){
  sweetsEl.innerHTML = "";
  hotEl.innerHTML = "";

  items.forEach((i, idx) => {
    const d = document.createElement("div");
    d.className = "item";
    d.draggable = true;

    // CARD CLICK → 500g
    d.onclick = (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;
      addGrams(i.id, 500);
    };

    d.innerHTML = `
      <button class="delete-btn" onclick="deleteItem(${idx})">×</button>
      <div class="item-number">${i.id}</div>

      <img src="${i.img}">
      <b>${i.name}</b>
      <p>₹${i.priceKg}/kg | ₹${i.pricePiece}/pc</p>

      <!-- WEIGHT INPUTS -->
      <div class="card-row two-cols">
      <input
          type="number"
          placeholder="₹ amount"
          oninput="calcQtyFromPrice(${i.id}, this.value)">
        
        <input
          placeholder="pcs"
          onkeydown="if(event.key==='Enter')addCustomPiece(${i.id}, this)">
      </div>

      <!-- AMOUNT TO QTY -->
      <!-- TOP ROW -->
      <div class="card-row">
        <input
          placeholder="grams"
          onkeydown="if(event.key==='Enter')addCustomGram(${i.id}, this)">
      </div>

      <div class="price-info" id="priceInfo-${i.id}">
        <small>—</small>
      </div>

    `;

    d.ondragstart = () => dragIndex = idx;
    d.ondragover = e => e.preventDefault();
    d.ondrop = () => {
      const it = items.splice(dragIndex, 1)[0];
      items.splice(idx, 0, it);
      items.forEach((x, i) => x.id = i + 1);
      localStorage.setItem("items", JSON.stringify(items));
      renderItems();
    };

    (i.category === "hot" ? hotEl : sweetsEl).appendChild(d);
  });
}


function deleteItem(idx){
  items.splice(idx,1);
  items.forEach((x,i)=>x.id=i+1);
  localStorage.setItem("items",JSON.stringify(items));
  renderItems();
}

/* ================= MULTI CUSTOMER ================= */
function addCustomer(){
  const id="C"+Date.now();
  customers.push({id,billItems:[],billTotal:0});
  activeCustomerId=id;
  renderCustomerTabs();
  renderBill();
}

function renderCustomerTabs(){
  customerTabs.innerHTML="";
  customers.forEach(c=>{
    const b=document.createElement("button");
    b.className="customer-tab"+(c.id===activeCustomerId?" active":"");
    b.innerText=c.id;
    b.onclick=()=>{
      activeCustomerId=c.id;
      renderCustomerTabs();
      renderBill();
    };
    customerTabs.appendChild(b);
  });
}

function getActiveCustomer(){
  return customers.find(c=>c.id===activeCustomerId);
}

/* ================= BILLING ================= */
function addGrams(id,g){
  const item=items.find(x=>x.id===id);
  const cust=getActiveCustomer();
  const amt=(g/1000)*item.priceKg;
  cust.billItems.push({name:item.name,grams:g,pieces:0,amount:amt});
  cust.billTotal+=amt;
  renderBill();
}

function addPieces(id,p){
  const item=items.find(x=>x.id===id);
  const cust=getActiveCustomer();
  const amt=p*item.pricePiece;
  cust.billItems.push({name:item.name,grams:0,pieces:p,amount:amt});
  cust.billTotal+=amt;
  renderBill();
}

function addCustomGram(id,input){
  const v=+input.value||0;
  if(v){ addGrams(id,v); input.value=""; }
}
function addCustomPiece(id,input){
  const v=+input.value||0;
  if(v){ addPieces(id,v); input.value=""; }
}

function renderBill(){
  const cust=getActiveCustomer();
  billBody.innerHTML="";
  cust.billItems.forEach((i,idx)=>{
    billBody.innerHTML+=`
      <tr>
        <td>${i.name}</td>
        <td>${i.grams?i.grams+" g":i.pieces+" pcs"}</td>
        <td>${i.amount.toFixed(2)}</td>
        <td><button onclick="removeBill(${idx})">X</button></td>
      </tr>`;
  });
  billTotalEl.innerText=cust.billTotal.toFixed(2);
}

function removeBill(idx){
  const cust=getActiveCustomer();
  cust.billTotal-=cust.billItems[idx].amount;
  cust.billItems.splice(idx,1);
  renderBill();
}

/* ================= FINALIZE ================= */
finalizeBtn.onclick=()=>{
  const custIndex=customers.findIndex(c=>c.id===activeCustomerId);
  const cust=customers[custIndex];
  if(!cust.billItems.length) return;

  cust.billItems.forEach(i=>{
    itemSales[i.name]=itemSales[i.name]||{grams:0,pieces:0};
    itemSales[i.name].grams+=i.grams;
    itemSales[i.name].pieces+=i.pieces;
  });

  localStorage.setItem("itemSales",JSON.stringify(itemSales));
  customers.splice(custIndex,1);

  if(customers.length===0) addCustomer();
  else activeCustomerId=customers[0].id;

  renderCustomerTabs();
  renderBill();
};

/* ================= ORDERS ================= */
function addOrder(){
  const total=+oTotal.value;
  const paid=+oPaid.value;
  const balance=total-paid;

  orders.push({
    name:oName.value,
    mobile:oMobile.value,
    date:oDate.value,
    time:new Date().toLocaleTimeString(),
    paid,
    balance,
    notes:oNotes.value,
    status:"pending",
    balanceAdded:false
  });

  localStorage.setItem("orders",JSON.stringify(orders));
  renderOrders();
}

function renderOrders(){
  const priority={pending:1,done:2,cancelled:3};
  orders.sort((a,b)=>priority[a.status]-priority[b.status]);

  orderBody.innerHTML="";
  orders.forEach((o,i)=>{
    orderBody.innerHTML+=`
      <tr class="status-${o.status}">
        <td>${o.name}</td>
        <td>${o.mobile}</td>
        <td>${o.date}<br><small>${o.time}</small></td>
        <td>${o.paid}</td>
        <td>${o.balance}</td>
        <td class="notes-col">${o.notes}</td>
        <td>
          <button class="btn-done" onclick="setOrderStatus(${i},'done')">Done</button>
          <button class="btn-pending" onclick="setOrderStatus(${i},'pending')">Pending</button>
          <button class="btn-cancel" onclick="setOrderStatus(${i},'cancelled')">Cancel</button>
        </td>
      </tr>`;
  });
}

function setOrderStatus(i,status){
  const o=orders[i];
  if(status==="done"&&!o.balanceAdded){
    o.balanceAdded=true;
  }
  o.status=status;
  localStorage.setItem("orders",JSON.stringify(orders));
  renderOrders();
}

/* ================= REPORTS ================= */
function renderDaily(){
  dailyBody.innerHTML="";
  for(let k in itemSales)
    dailyBody.innerHTML+=`<tr><td>${k}</td><td>${itemSales[k].grams}</td><td>${itemSales[k].pieces}</td></tr>`;
}
function renderMonthly(){ renderDaily(); }
function calcQtyFromPrice(itemId, amount){
  const item = items.find(x => x.id === itemId);
  const infoEl = document.getElementById(`priceInfo-${itemId}`);

  amount = Number(amount);
  if(!amount || amount <= 0){
    infoEl.innerHTML = "<small>—</small>";
    return;
  }

  let gramsText = "";
  let piecesText = "";

  if(item.priceKg > 0){
    const grams = Math.floor((amount / item.priceKg) * 1000);
    gramsText = `${grams} g`;
  }

  if(item.pricePiece > 0){
    const pieces = Math.floor(amount / item.pricePiece);
    piecesText = `${pieces} pcs`;
  }

  infoEl.innerHTML = `
    <small>
      ${gramsText ? "Grams: <b>" + gramsText + "</b><br>" : ""}
      ${piecesText ? "Pieces: <b>" + piecesText + "</b>" : ""}
    </small>
  `;
}
