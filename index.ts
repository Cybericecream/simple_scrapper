import { response } from "express";

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const app = express();

interface ParamsInterface {
    page: Number,
    resultsPerPage?: Number,
    other: String
}

interface ParamsRulesInterface {
    page: string,
    resultsPerPage?: string
}

interface jsonExportInterface {
    name: String,
    url: String
}

interface UrlDataOutput {
    output?: jsonExportInterface[],
    continueIterate?: Boolean
}

// Set Variables
let exportJson: jsonExportInterface[] = [];

function urlBuilder(url: String, paramRules: ParamsRulesInterface, params: ParamsInterface) {
    let output: String = '';
    let resultsPerPage: String = '';

    if (paramRules.resultsPerPage && params.page) {
        resultsPerPage = `${paramRules.resultsPerPage}=${params.page}&`
    }
    
    output = `${url}?${paramRules.page}=${params.page}&${resultsPerPage ? resultsPerPage : ''}${params.other}`

    return output;
}
// https://www.lttstore.com/collections/all-products/?page=2&sort_by=title-ascending

const getUrlData = async (url: String) => {

    let outputJson: jsonExportInterface[] = [];
    let output: UrlDataOutput;

    await axios(url).then(response => {
        const html = response.data;
        const pageData = cheerio.load(html);
    
        pageData('.ProductItem__Title', html).each(function() {
            let productTitle = pageData(this).text();
            let productUrl = pageData(this).attr('href');

            productTitle = productTitle.replace(/(\r\n|\n|\r)/gm, "")
            productTitle = productTitle.substring(12)
            let json: jsonExportInterface = {
                name: productTitle,
                url: productUrl
            }
            if (json.url !== undefined){
                outputJson.push(json)
            }
        });
    }).finally(() => {
        if (outputJson.length !== 0 ) {
            output = {
                output: outputJson
            };
        } else {
            output = {
                continueIterate: false
            }
        }
    })

    return output;
}

const buildData = async (): Promise<jsonExportInterface[]> => {

    let products: jsonExportInterface[] = [];
    let continueIterate: Boolean = true;

    const scrapeUrl: String = 'https://www.lttstore.com/collections/all-products/';
    let scrapeUrlParams: ParamsInterface = {
        page: 1,
        other: 'sort_by=title-ascending'
    }
    const urlParamsRules: ParamsRulesInterface = {
        page: 'page'
    }

    while (continueIterate) {

        const url = urlBuilder(scrapeUrl, urlParamsRules, scrapeUrlParams);
        const tempProducts: UrlDataOutput = await getUrlData(url);

        if (tempProducts.continueIterate === false) {
            continueIterate = false;
        } else {
            tempProducts.output.forEach(element => {
                products.push(element)
            });
        }

        scrapeUrlParams.page = Number(scrapeUrlParams.page) + Number(1);
    }

    console.log(products);
    return products;
}


const start = async (): Promise<void> => {
    try {
      app.listen(3000, () => {
        console.log("Server started on port 3000");
      });
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  };
  
  void start();
  const productData = buildData();
