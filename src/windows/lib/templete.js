class Templete
{
    constructor() {}

    static account(address, name) {
        return `
        <div class="cont_use_blue2">
							<div class="hh_cont_use_blue" style="width: 15%;margin-left: 3em;">
								<img class="hh_image_title" src="img/a1@3x.png"/>
								<span class="hh_span">${name}</span>
							</div>
							<div class="hh_cont_use_blue" style="width: 60%;">
								<img class="hh_image_title" src="img/a2@3x.png"/>
								<span class="hh_span_address">${address}</span>
							</div>
						</div> 
    `;

    

        // return `

        // <a class="wallet-box" onclick="return false;">
        //     <span></span>
        //     <h3 class="not-ens-name">
        //         <i class="iconfont icon-key"></i>
        //         ${name}
        //     </h3>
        //     </span>
        //     <span class="account-id">${address}</span>
        // </a>
        // `;


    }
}