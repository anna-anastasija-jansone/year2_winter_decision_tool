const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = { format(value) { const rounded = Math.round(value); return rounded < 0 ? `(Sh ${number.format(Math.abs(rounded))})` : `Sh ${number.format(rounded)}`; } };
const input = (id) => Number(document.getElementById(id).value) || 0;
const text = (id) => document.getElementById(id).value.trim();
const percent = (value) => value / 100;

function globalInputs() {
  return {
    openingCash: input("openingCash"), taxLossPool: input("taxLossPool"), unpaidLoan: input("unpaidLoan"), existingPrincipal: input("existingPrincipal"),
    existingInterestRate: percent(input("existingInterestRate")), salesPrice: input("salesPrice"), milkPrice: input("milkPrice"), milkYield: input("milkYield"),
    fixedSalaries: input("fixedSalaries"), bonusRate: percent(input("bonusRate")), taxRate: percent(input("taxRate")), newInterestRate: percent(input("newInterestRate")),
  };
}

function calculateOption(key, global) {
  const production = input(`production${key}`), milkTons = input(`milkTons${key}`), request = input(`request${key}`), actualSales = input(`actualSales${key}`);
  const marketInvestment = input(`marketInvestment${key}`), rent = input(`rent${key}`), transportRate = input(`transportRate${key}`), capacity = input(`capacity${key}`);
  const maintenance = input(`maintenance${key}`), depreciation = input(`depreciation${key}`), machinePurchase = input(`machinePurchase${key}`), borrowing = input(`borrowing${key}`), term = Math.max(1, input(`loanTerm${key}`));
  const milkCost = milkTons * global.milkPrice;
  const revenue = actualSales * global.salesPrice;
  const milkSupported = milkTons * global.milkYield;
  const spoilage = Math.max(0, production - actualSales);
  const transport = actualSales * transportRate;
  const grossProfit = revenue - milkCost - maintenance - depreciation;
  const bonus = Math.max(0, grossProfit) * global.bonusRate;
  const existingInterest = global.unpaidLoan * global.existingInterestRate;
  const newInterest = borrowing * global.newInterestRate;
  const newPrincipal = borrowing / term;
  const profitBeforeTax = grossProfit - transport - marketInvestment - bonus - global.fixedSalaries - rent - existingInterest - newInterest;
  const lossPoolUsed = Math.min(Math.max(0, profitBeforeTax), global.taxLossPool);
  const tax = Math.max(0, profitBeforeTax - lossPoolUsed) * global.taxRate;
  const netProfit = profitBeforeTax - tax;
  const advanceCash = global.openingCash + borrowing - machinePurchase - milkCost - marketInvestment;
  const closingCash = advanceCash + revenue - rent - maintenance - transport - global.fixedSalaries - bonus - global.existingPrincipal - existingInterest - newPrincipal - newInterest - tax;
  const requestedInBlocks = request % 10000 === 0;
  return { production, milkTons, request, actualSales, marketInvestment, rent, capacity, maintenance, depreciation, machinePurchase, borrowing, milkSupported, spoilage, revenue, milkCost, transport, grossProfit, bonus, existingInterest, newInterest, newPrincipal, profitBeforeTax, lossPoolUsed, tax, netProfit, advanceCash, closingCash, requestedInBlocks };
}

function check(label, good, bad) { return `<span class="check ${good ? "" : "bad"}">${good ? label : bad}</span>`; }
function renderResults(key, plan) {
  const output = document.getElementById(`results${key}`);
  const plRows = [
    ["Revenue", plan.revenue], ["Milk cost", -plan.milkCost], ["Machine maintenance", -plan.maintenance], ["Machine depreciation", -plan.depreciation], ["Gross profit", plan.grossProfit, "total"],
    ["Transport", -plan.transport], ["Market investment", -plan.marketInvestment], ["Bonus", -plan.bonus], ["Fixed salaries", -globalInputs().fixedSalaries], ["Premise rent", -plan.rent], ["Existing-loan interest", -plan.existingInterest], ["New-loan interest", -plan.newInterest], ["Profit before tax", plan.profitBeforeTax, "total"], ["Tax-loss pool used", -plan.lossPoolUsed], ["Game tax", -plan.tax], ["Net profit / (loss)", plan.netProfit, "total"]
  ];
  const cfRows = [
    ["Opening cash", globalInputs().openingCash], ["New borrowing", plan.borrowing], ["New machine purchase", -plan.machinePurchase], ["Milk purchase", -plan.milkCost], ["Market investment", -plan.marketInvestment], ["Cash after advance payments", plan.advanceCash, "cash-check"],
    ["Sales receipt", plan.revenue], ["Premise rent", -plan.rent], ["Maintenance", -plan.maintenance], ["Transport", -plan.transport], ["Fixed salaries", -globalInputs().fixedSalaries], ["Bonus", -plan.bonus], ["Existing-loan principal", -globalInputs().existingPrincipal], ["Existing-loan interest", -plan.existingInterest], ["New-loan principal", -plan.newPrincipal], ["New-loan interest", -plan.newInterest], ["Game tax", -plan.tax], ["Closing cash", plan.closingCash, "total"]
  ];
  const rows = (list) => list.map(([label, value, className = ""]) => `<tr class="${className}"><td>${label}</td><td>${money.format(value)}</td></tr>`).join("");
  output.innerHTML = `
    <div class="result-grid">
      <div class="metric"><span>Revenue</span><strong>${money.format(plan.revenue)}</strong></div>
      <div class="metric"><span>Spoilage</span><strong>${number.format(plan.spoilage)} units</strong></div>
      <div class="metric"><span>Gross profit</span><strong>${money.format(plan.grossProfit)}</strong></div>
      <div class="metric"><span>Interest this season</span><strong>${money.format(plan.existingInterest + plan.newInterest)}</strong></div>
      <div class="metric highlight"><span>Projected net profit</span><strong>${money.format(plan.netProfit)}</strong></div>
      <div class="metric ${plan.closingCash < 0 ? "risk" : "highlight"}"><span>Projected closing cash</span><strong>${money.format(plan.closingCash)}</strong></div>
      <div class="metric ${plan.advanceCash < 0 ? "risk" : ""}"><span>Cash after advance payments</span><strong>${money.format(plan.advanceCash)}</strong></div>
      <div class="metric"><span>Tax-loss pool used</span><strong>${money.format(plan.lossPoolUsed)}</strong></div>
    </div>
    <div class="checks">
      ${check("Milk covers production", plan.production <= plan.milkSupported, "Need more milk")}
      ${check("Capacity covers production", plan.production <= plan.capacity, "Need more capacity")}
      ${check("Sales do not exceed production", plan.actualSales <= plan.production, "Sales exceed production")}
      ${check("Request uses 10,000 blocks", plan.requestedInBlocks, "Request must use 10,000 blocks")}
      ${check("Advance cash is non-negative", plan.advanceCash >= 0, "Negative before market")}
      ${check("Closing cash is non-negative", plan.closingCash >= 0, "Negative closing cash")}
    </div>
    <details class="financial-details" open><summary>Projected profit and loss</summary><table><tbody>${rows(plRows)}</tbody></table></details>
    <details class="financial-details"><summary>Projected cash flow</summary><table><tbody>${rows(cfRows)}</tbody></table></details>`;
}

function updateComparison(a, b) {
  const nameA = text("nameA") || "Option A", nameB = text("nameB") || "Option B";
  const difference = a.netProfit - b.netProfit;
  const cashDifference = a.closingCash - b.closingCash;
  const moreProfitable = difference >= 0 ? nameA : nameB;
  const saferCash = cashDifference >= 0 ? nameA : nameB;
  document.getElementById("comparisonText").innerHTML = `<strong>${moreProfitable}</strong> projects ${money.format(Math.abs(difference))} more net profit than the other option. <strong>${saferCash}</strong> finishes with ${money.format(Math.abs(cashDifference))} more cash. The most visible operating difference is ${number.format(Math.abs(a.spoilage - b.spoilage))} units of additional spoilage between the plans.`;
  const chosen = document.getElementById("recommendedOption").value === "a" ? { name: nameA, plan: a } : { name: nameB, plan: b };
  const assumption = text("importantAssumption") || "Add your key assumption here.";
  document.getElementById("recommendation").innerHTML = `<strong>Recommendation: ${chosen.name}</strong><span>This plan assumes: ${assumption}</span><br><span>If actual allocation is lower than expected, revenue falls while milk, rent, market investment, and most machine costs remain. Re-enter the lower allocation above before deciding.</span>`;
}

function updateValidation() {
  const status = document.getElementById("carryInStatus");
  const historical = {
    start: input("winterStartingCash"), loan: input("winterLoan"), machine: input("winterMachinePurchase"), milk: input("winterMilkCost"), sales: input("winterSalesRevenue"), market: input("winterMarketInvestment"), rent: input("winterRent"), maintenance: input("winterMaintenance"), transport: input("winterTransport"), salaries: input("winterSalaries"), principal: input("winterPrincipal"), interest: input("winterInterest"), depreciation: input("winterDepreciation"), tax: input("winterTax"),
  };
  const profit = historical.sales - historical.milk - historical.maintenance - historical.depreciation - historical.transport - historical.market - historical.salaries - historical.rent - historical.interest - historical.tax;
  const cash = historical.start + historical.loan + historical.sales - historical.machine - historical.milk - historical.market - historical.rent - historical.maintenance - historical.transport - historical.salaries - historical.principal - historical.interest - historical.tax;
  document.getElementById("winterProfitCalculated").textContent = money.format(profit);
  document.getElementById("winterCashCalculated").textContent = money.format(cash);
  const matches = Math.round(profit) === -75175 && Math.round(cash) === 31700;
  status.textContent = matches ? "Matches Winter figures" : "Check the Winter inputs";
  status.style.color = matches ? "#1d6a4d" : "#a86d14";
}

function update() { const global = globalInputs(); const a = calculateOption("A", global), b = calculateOption("B", global); renderResults("A", a); renderResults("B", b); updateComparison(a, b); updateValidation(); }
document.querySelectorAll("input, select, textarea").forEach((element) => element.addEventListener("input", update));
update();
