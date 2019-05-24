class Templete
{
    constructor() {}

    static account(address, name) {
        return `
        <a class="wallet-box" href="${address}" onclick="return false;">
            <span></span>
            <h3 class="not-ens-name">
                <i class="iconfont icon-key"></i>
                ${name}
            </h3>
            </span>
            <span class="account-id">${address}</span>
        </a>
        `;
    }
}