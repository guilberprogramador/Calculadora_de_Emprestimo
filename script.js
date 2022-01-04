function calculate(){
    // pesquisa os elementos de entrada e saida no documento
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totallinterest = document.getElementById("totalinterest");

    // obtem a entrada do usuario através dos elementos de entrada. presume que tudo isso é valido
    // converte os juros de porcentagem para decimais e converte de taxa
    // anual para tava mensal. Converte o periodo de pagamento em anos
    // para o numero  de pagementos mensais 

    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12;
    var payments = parseFloat(years.value) * 12;

    // agora calcula o valor do pagamento mensal.
    var x = Math.pow(1 + interest, payments); // math.pow() calcula potencias
    var monthly = (principal*x*interest)/(x-1);

    // se o resultado é um número finito, a entrada do usuario estava correta e temos resultados significativos para exibir

    if(isFinite(monthly)){
        // preenche os campos de saida, arredondando para 2 casas decimais
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totallinterest.innerHTML = ((monthly*payments)-principal).toFixed(2);

        // salva a entrada do usuario para que possamos recuperala na proxima vex que ele visitar
        save(amount.value, apr.value, years.value, zipcode.value);

        // anuncio: localiza e exibe financeiras locais, mas ignora erros de rede 
        try{
            // captura quaisquer erros que ocorra dentro destas chaves
            getLenders(amount.value, apr.value, years.value, zipcode.value);

        }catch(e){ /* ignora esses erros*/}

        // por fim, traça o grafico do saldo devedor, dos juros e dos pagamentos do capital
        chart(principal, interest, monthly, payments);
    }else{
        // o resultado foi not a number ou infinito, oque significa que a entrada
        // estava incompleta ou era invalida. apagfa qualquer saida exibida anteriormente.
        payment.innerHTML = ""; // apaga o conteudo desses elementos
        total.innerHTML = ""
        totallinterest.innerHTML = " ";
        chart(); // sem argumentos, apaga o grafico
    }
}
// salva a entrada do usuario como propriedades do objeto localstorage. Essas
// Propriedades aida existirão quando o usuario visitar no futuro
// esse recurso de armazenamento não vai funcionar em alguns navegadores

function save(amount, apr, years, zipcode){
    if(window.localStorage){// só faz isso se o navegador suportar
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;

    }
}

// tenta restaurar os campos de entrada automaticamente quando o documento é carregado
// pela primeira vez
window.onload = function(){
    // se o navegador suporta localstorage e temos alguns dados armazenados
    if(window.localStorage && localStorage.loan_amount){
        document.getElementById("amount").value = localStorage.loan_amount;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("years").value = localStorage.loan_years;
        document.getElementById("zipcode").value = localStorage.loan_zipcode;
        
    }
};

// passa a entrada do usuario para um script no lado do servidor que (teoricamente) pode retornar
// uma lista de links para financeiras locais interresadas em fazer emprestimos
// este exemplo não contêm uma implementação real desse serviço de busca de financeiras.
// mas se o serviço existisse, essa função funcionaria com ele

function getLenders(amount, apr, years, zipcode){
    // se o navegador não suporta o objeto xmlhttprequest, não faz nada
    if(!window.XMLHttpRequest)return;

    // localiza o elemento para exibir a lista de financeiras
    var ad  = document.getElementById("lenders");
    if(!ad)return; // encerra se não há ponto de saida
    // codifica a entrada do usuario como parametros de consulta em um url
    var url = "getLenders.php" + // url de serviço mais
    "?amt=" + encodeURIComponent(amount) + // dados do usuario na string de consulta
    "&apr=" + encodeURIComponent(years) + 
    "&zip=" + encodeURIComponent(zipcode);

    // busca o conteudo desse url usando o objeto xmlhttprequest

    var req = new XMLHttpRequest(); // inicia um novo pedido
    req.open("GET", url); // um pedido GET da http para url
    req.send(null); // envia o pedido sem corpo


    // antes de retornar , registra um função de rotina de tratamento de evento que será
    // chamada em um momento posterior, quando a resposta do servidor http chegar.
    // esse tipo de programação assincrona é muito comum em javascript do lado do cliente.

    req.onreadystatechange = function(){
        if(req.readyState == 4 && req.status == 200){
            // se chegamos até aqui, obtivemos uma resposta http válida e completa
            var response = req.responseText; // resposta http como string
            var lenders = JSON.parse(response); // analisa em um array js

            // converte o array de objetos lender em uma string html

            var list = "";
            for(var i = 0; i < lenders.length; i++){
                list += "<li><a href='" + lenders[i].url + "'>" + lenders[i].name + "</a>";

            }

            // exibe o codigo html no elemento acima
            ad.innerHTML = "<ul>" + list + "</ul>";
        }
    }

}

// faz o grafico do saldo devedor mensal, dos juros e do capital em um elemento <canvas>
// da html.
// se for chamado sem argumentos, basta apagar qualquer gráfico desenhado anteriormente.

function chart(principal, interest, monthly, payments){
    var graph = document.getElementById("graph"); // obtem a marca canvas
    graph.width = graph.width; // magica para apagar e redefinir o elemento canvas

    // se chamamos sem argumentos ou se esse navegador não suporta
    // elementos gráficos em um elemento canvas, basta retornar agora.

    if(arguments.length == 0 || !graph.getContext) return;

    //obtém o objeto "contexto" de canvas que define api de desenho

    var g = graph.getContext("2d"); // todo desenho é feit com esse objeto
    var width = graph.width, height = graph.height; // obtem o tamanho da tela de desenho

    // essas funções convertem numero de pagamento e valores monetários em pixels

    function paymentToX(n){ return n * width/payments;}
    function amountToY(a){ return height-(a * height/(monthly*payments*1.05));}

    // os pagamentos são uma linha reta de (0,0) 
    g.moveTo(paymentToX(0), amountToY(0)); // começa no canto inferior esquerdo
    g.lineTo(paymentToX(payments), amountToY(monthly*payments)); // desenha atá o canto superior direito
    g.lineTo(paymentToX(payments), amountToY(0)); // para baixo , atá o canto inferior direito
    g.closePath(); // e volta ao inicio
    g.fillStyle = "#f88"; // vermelho-claro
    g.fill(); // preenche o triangulo
    g.font = "bold 12px sans-serif"; // define uma fonte
    g.fillText("TOTAL INTEREST PAYMENTS", 20,20); // desenha texto na legenda

    // capital acumulado não é linear e é mais complicado de representar no gráfico 
    var equity = 0;
    g.beginPath(); // inicia uma nova figura
    g.moveTo(paymentToX(0), amountToY(0)); // começando no canto inferior esquerdo

    for(var p = 1; p <= payments; p++){
        // para cada pagamento, descobre quanto é o juro
        var thisMonthInterest = (principal-equity)*interest;
        equity += (monthly - thisMonthInterest); // o resto vai para o capital
        g.lineTo(paymentToX(p),amountToY(equity)); // linha até este ponto
    }

    g.lineTo(paymentToX(payments), amountToY(0));  // linha de volta para o eixo y
    g.closePath(); // e volta para o ponto inicial
    g.fillStyle = "green"; // agora usa tinta verde
    g.fill();
    g.fillText("TOTAL EQUITY", 20,35); // rotula em verde

    // faz o laço novamente, como acima, mas representa o saldo devedor como uma linha preeta grossa no gráfico
    var bal = principal;
    g.beginPath(); // inicia uma nova figura
    g.moveTo(paymentToX(0), amountToY(bal)); // começando no canto inferior esquerdo

    for(var p = 1; p <= payments; p++){
        // para cada pagamento, descobre quanto é o juro
        var thisMonthInterest = bal*interest;
        bal += (monthly - thisMonthInterest); // o resto vai para o capital
        g.lineTo(paymentToX(p),amountToY(bal)); // desenha linha até este ponto
    }
    g.lineWidth = 3; // usa uma linha grossa
    g.stroke(); // desenha a curva do saldo
    g.fillStyle = "black";  // troca para texto preto
    g.fillText("LOAN BALANCE", 20,50); // entrada da legenda

    // agora faz marcações anuais e os numeros de ano no eixo x
    g.textAlign = "center"; // centraliza o texto na marcas 
    
    var y = amountToY(0);

    for(var year = 1; year*12 <= payments; year++){
        var x = paymentToX(year*12);
        g.fillRect(x-0.5,y-3,1,3);
        if(year == 1) g.fillText("YEAR", x, y-5);
        
        if(year % 5 == 0 && year*12 !== payments) // numera cada 5 anos
        g.fillText(String(year), x, y-5);
    }

    // marca valores de pagamento ao longo da margem direita
    g.textAlign = "right"; // alinha o texto á direita
    g.textBaseline = "middle"; // centraliza verticalmente
    var ticks = [monthly*payments, principal]; // os dois pontos que marcaremos
    var rightEdge = paymentToX(payments);
    
    for(var i = 0; i < ticks.length; i++){
        var y = amountToY(ticks[i]);
        g.fillRect(rightEdge-3, y-0.5, 3,1);
        g.fillText(String(ticks[i].toFixed(0)),rightEdge-5, y);
    }

    
}