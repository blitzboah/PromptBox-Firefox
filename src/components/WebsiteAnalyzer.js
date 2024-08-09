import React,{useState} from 'react'
import ColorPalette from './ColorPalette'
import LayoutAnalysis from './LayoutAnalysis'
import Rating from './Rating'
import { analyzeColors } from '../utils/colorAnalysis';
import { analyzeLayout } from '../utils/layoutAnalysis';

function WebsiteAnalyzer(){
    const [url, setUrl] = useState('') ;
    const [analysis, setAnalysis] = useState('null') ;

    const handleAnalyze = async() => {
        try{
            const response = await fetch(`http://cors-anywhere.herokuapp.com/corsdemo`)
            const html = await response.text() ;

            const colorAnalysis = analyzeColors(html) ;
            const layoutAnalysis = analyzeLayout(html) ;

            setAnalysis({colorAnalysis, layoutAnalysis}) ;

        }catch(error){
            console.error("error" , error) ;
        }
        
    }

    return (
        <div>
            <input
                type='text'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='enter website url'
            />
            <button onClick={handleAnalyze}>analyze</button>
            {analysis && (
                <div>
                    <ColorPalette colors = {analysis.colorAnalysis.palette}/>
                    <LayoutAnalysis data = {analysis.layoutAnalysis}/>
                    <Rating colorScore={analysis.colorAnalysis.score} layoutScore={analysis.layoutAnalysis.score} />
                </div>
            )}
        </div>
    )

}

export default WebsiteAnalyzer 







































