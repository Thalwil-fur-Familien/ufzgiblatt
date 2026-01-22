import { ProblemFactory, ProblemData } from './Problem.js';
import { LAYOUT_CONFIG } from './problemConfig.js';
import { lang, T } from './state.js';

export function createProblemElement(problemData: ProblemData, isSolution: boolean) {
    const problemDiv = document.createElement('div');
    problemDiv.className = 'problem';

    const span = problemData.span || 12;
    problemDiv.style.gridColumn = `span ${span}`;

    const rowSpan = Math.max(1, Math.round((problemData as any).weight / (span || 1)));
    problemDiv.style.gridRow = `span ${rowSpan}`;

    const boundaryDiv = document.createElement('div');
    boundaryDiv.className = 'problem-boundary';
    problemDiv.appendChild(boundaryDiv);

    const target = boundaryDiv;

    const baseConfig = (LAYOUT_CONFIG as any)[(problemData as any).moduleType] || (LAYOUT_CONFIG as any)[problemData.type] || (LAYOUT_CONFIG as any)['default'];
    const baseSpan = baseConfig.span || 12;
    const scaleFactor = span / baseSpan;

    if (Math.abs(scaleFactor - 1) > 0.01) {
        target.style.transform = `scale(${scaleFactor})`;
        target.style.transformOrigin = 'top left';
        target.style.width = `${100 / scaleFactor}%`;
        target.style.height = `${100 / scaleFactor}%`;
    }

    const problemInstance = ProblemFactory.create(problemData);
    problemInstance.render(target, isSolution, lang);

    return problemDiv;
}

export function createSheetElement(titleText: string, problemDataList: ProblemData[], isSolution: boolean, pageInfo: any, isEditable = false, basePath = './') {
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'sheet';

    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-container';
    const showQRInput = document.getElementById('showQR') as HTMLInputElement;
    if (showQRInput && !showQRInput.checked) {
        qrContainer.classList.add('qr-hidden');
    }
    sheetDiv.appendChild(qrContainer);

    const sheetLogo = document.createElement('img');
    sheetLogo.src = basePath + 'images/logo/logo_ufzgiblatt1_text_below_centered.png';
    sheetLogo.className = 'sheet-logo';
    sheetDiv.appendChild(sheetLogo);

    const header = document.createElement('div');
    header.className = 'sheet-header';
    header.innerHTML = `
        <div style="width:190px;"></div>
        <div style="display:flex; gap: 40px;">
            <div class="header-field">${T.ui.headerName} <span class="line"></span></div>
            <div class="header-field">${T.ui.headerDate} <span class="line"></span></div>
        </div>
        <div style="width:100px;"></div>
    `;
    sheetDiv.appendChild(header);

    const h1 = document.createElement('h1');
    h1.textContent = titleText + (isSolution ? T.ui.solutionsSuffix : '');
    if (isSolution) h1.style.color = '#27ae60';

    if (isEditable && !isSolution) {
        h1.contentEditable = "true";
        h1.style.minWidth = "200px";
        h1.oninput = function (e: Event) {
            const target = e.currentTarget as HTMLElement;
            if ((window as any).updateBuilderTitle) {
                (window as any).updateBuilderTitle(target.textContent);
            } else if ((window as any).updateGeneratorTitle) {
                (window as any).updateGeneratorTitle(target.textContent);
            }
        };
        h1.onkeydown = function (e: KeyboardEvent) {
            if (e.key === 'Enter') {
                e.preventDefault();
                (e.currentTarget as HTMLElement).blur();
            }
        };
    }

    sheetDiv.appendChild(h1);

    const grid = document.createElement('div');
    grid.className = 'problem-grid';

    problemDataList.forEach(p => {
        grid.appendChild(createProblemElement(p, isSolution));
    });

    sheetDiv.appendChild(grid);

    if (problemDataList.length > 0 && problemDataList[0].type === 'word_types' && !isSolution) {
        const legend = document.createElement('div');
        legend.className = 'word-types-legend';
        legend.innerHTML = `
            <div class="legend-item" data-type="noun" onclick="setActiveWordType('noun')"><div class="legend-color" style="background:red"></div> ${T.ui.wordTypesLegend.noun}</div>
            <div class="legend-item" data-type="verb" onclick="setActiveWordType('verb')"><div class="legend-color" style="background:blue"></div> ${T.ui.wordTypesLegend.verb}</div>
            <div class="legend-item" data-type="adj" onclick="setActiveWordType('adj')"><div class="legend-color" style="background:green"></div> ${T.ui.wordTypesLegend.adj}</div>
            <div class="legend-item" data-type="artikel" onclick="setActiveWordType('artikel')"><div class="legend-color" style="background:orange"></div> ${T.ui.wordTypesLegend.artikel}</div>
            <div class="legend-item" data-type="none" onclick="setActiveWordType('none')"><div class="legend-color" style="background:#888; height: 10px; width: 10px; border-radius: 2px;"></div> ${T.ui.wordTypesLegend.eraser}</div>
            <div style="font-style:italic; margin-left:10px;">${T.ui.wordTypesLegend.instruction}</div>
        `;
        sheetDiv.insertBefore(legend, grid);
    }

    const footer = document.createElement('div');
    footer.className = 'sheet-footer';
    if (pageInfo) {
        footer.textContent = `${pageInfo.current}${isSolution ? T.ui.solutionsSuffix : ''}`;
    }
    sheetDiv.appendChild(footer);

    return sheetDiv;
}
