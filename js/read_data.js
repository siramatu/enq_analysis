
let label2texts = {};

function addPlus(val) {
	if (val < 0) { return val; }
	else { return "+" + val; }
}

function getCorrStr(corrData) {
    return addPlus(corrData["r"]) + "<br /><span class=\"confint\">[" +
	addPlus(corrData["rl"]) + ", " + addPlus(corrData["ru"]) + "]</span>";
}

function appendHeader(table, explFeat, pol) {
    
    let thead = $("<thead>", { class: getPolarity(explFeat, pol) }).appendTo(table);
    
    let featHeader = "<th width=\"70%\">";
    featHeader += "<span class=\""+getPolarity(explFeat, "posi")+"\">";
    featHeader += explFeat + "</span> と";
    featHeader += (pol == "posi") ? "正" : "負";
    featHeader += "の相関があった回答</th>";
    let corHeader = "<th width=\"30%\">";
    corHeader += "相関係数<br /><span class=\"confint\">95%信頼区間</span></th>";
    $("<tr>").appendTo(thead).append(featHeader + corHeader);

}

function getPolarity(explFeat, pol) {
    let context = (pol == "posi") ? 1 : -1;
    let expl = 1;
    if (explFeat.indexOf("（悪かったこと）") > 0 || explFeat.indexOf("特にない") >= 0) {
	expl = -1;
    }
    if (expl * context > 0) {
	return "posi";
    } else {
	return "nega";
    }
}

function createTable(parent, data, explFeat, pol) {
    let table = $("<table>").appendTo(parent);
    let enqTarget = $(parent).parents(".enq-target").attr("id");
    appendHeader(table, explFeat, pol);
    let tbody = $("<tbody>").appendTo(table);
    for (let feat in data) {
	//console.log(feat);
	let tr = $("<tr title>").appendTo(tbody);
	tr.append("<td class=\"feat\" data-label=\"" + feat + "\">" + feat + "</td>");
	tr.append("<td>" + getCorrStr(data[feat]) + "</td>");
    }    
    let label = $(parent).attr("data-label");
    //console.log(label);
    if (label2texts[label] == null) {
	let textJson = "./js/" + enqTarget + "-" + explFeat + "-" + pol + ".json";
	//console.log(textJson);
	$.getJSON(textJson, function (data) {
	    label2texts[label] = data;
	    //console.log("data: "+JSON.stringify(data));
	    table.find("tbody tr").each(function (index, elm) {
		let feat = $(elm).find("td.feat").attr("data-label");
		// console.log(elm)
		setTooltip(elm, data[feat]);
	    });
	}.bind(table));
    }
}


function setTooltip(elm, data) {
    let text = "";
    if (data == null) {
	text = "<div class=\"reldesc\">（対応する自由記述はありません）</span>";
    } else {
	//console.log("!!!! data: "+JSON.stringify(data));
	for (let i in data) {
	    if (i > 0) {
		text += "<hr />";
	    }
	    text += data[i]["text"];
	}
	text = "<div class=\"reldesc\">" + text + "</span>";	
    }
    $(elm).tooltip({
	content: function () {
	    return text;
	},
	open: function() {
	    $(elm).addClass("showingTooltip");
	}.bind(elm)
    });
    $(elm).on("mouseout", function(e) {
        e.stopImmediatePropagation();
    }).on("mouseleave", function(e) {
        e.stopImmediatePropagation();
    }).on("tooltipopen", function(e) {
	$("tr.showingTooltip").not($(elm)).tooltip("close");
    }.bind(elm));
    $("body").on("mouseleave", ".ui-tooltip", function(e) {
	$(elm).tooltip("close");
	$(elm).removeClass("showingTooltip");
    }.bind(elm)).on("mouseclick", function(e) {
	$(elm).tooltip("close");
	$(elm).removeClass("showingTooltip");
    }.bind(elm));
    //console.log("text: "+ text);
}

function creatPieChart(canvas, data) {
	if (data != null) {
		let ctx = canvas.getContext('2d');

		var chart = new Chart(ctx, {
			type: 'pie',
			data: {
				datasets: [{
					backgroundColor: [
						"#f4d002",
						"#80c686",
						"#ffff51",
						"#005193",
						"#002a65"
					],
					data: data["data"]
				}],
				labels: data["labels"]
			},
			options: {
				responsive: true,
			}
		});

	}
}

function read(json_file) {
	$.getJSON(json_file, function (data) {
		//console.log(data);
		for (let explFeat in data) {
			console.log(explFeat);
			$("#student").append("<h4>" + explFeat + "</h4>");

			let pieCanvas = $('<canvas></canvas>');
			$("#student").append(pieCanvas);
			creatPieChart(pieCanvas[0], data[explFeat]["freq"]);

			let explDiv = $("<div>", {
				class: "expl"
			}).appendTo('#student');
			let posiDiv = $("<div>", {
				class: "feat-table"
			}).appendTo(explDiv);
			posiDiv.attr("data-label", explFeat + "-posi");
			let negaDiv = $("<div>", {
				class: "feat-table"
			}).appendTo(explDiv);
			negaDiv.attr("data-label", explFeat + "-nega");
			let posi = data[explFeat]["posi"];
			createTable(posiDiv, posi, explFeat, "posi");
			let nega = data[explFeat]["nega"];
			createTable(negaDiv, nega, explFeat, "nega");
		}
	});

}

$(function () {
	read("./js/student.json");
});
